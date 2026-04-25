import { prisma } from "@/lib/db";

/**
 * Recalculates realized P&L for all transactions of a specific asset.
 * Pure service implementation.
 */
export async function recalculateAssetPnLService(assetId: string, userId: string) {
  const startTime = Date.now();
  
  const transactions = await prisma.transaction.findMany({
    where: { assetId, userId },
    orderBy: { date: 'asc' }
  });

  console.log(`[RecalcService] recalculateAssetPnL for asset ${assetId}. Found ${transactions.length} transactions.`);

  let currentQty = 0;
  let currentAvgCost = 0;

  const updates = [];

  for (const tx of transactions) {
    if (tx.type === 'BUY') {
      const newQty = currentQty + tx.quantity;
      if (newQty > 0) {
        currentAvgCost = (currentQty * currentAvgCost + tx.quantity * tx.pricePerUnit) / newQty;
      }
      currentQty = newQty;
      
      if (tx.realizedPnL !== 0) {
        updates.push(prisma.transaction.update({
          where: { id: tx.id },
          data: { realizedPnL: 0 }
        }));
      }
    } else if (tx.type === 'SELL') {
      const pnl = tx.quantity * (tx.pricePerUnit - currentAvgCost);
      
      updates.push(prisma.transaction.update({
        where: { id: tx.id },
        data: { realizedPnL: pnl }
      }));

      currentQty = Math.max(0, currentQty - tx.quantity);
      if (currentQty === 0) {
        currentAvgCost = 0;
      }
    }
  }

  if (updates.length > 0) {
    await prisma.$transaction(updates);
  }

  const duration = Date.now() - startTime;
  console.log(`[RecalcService] recalculateAssetPnL completed in ${duration}ms. Applied ${updates.length} updates.`);
}

/**
 * Recalculates the historical PortfolioSnapshots from a specific date onwards.
 * Optimized with a single-pass forward simulation (O(N)).
 */
export async function recalculateHistoricalSnapshotsService(startDate: Date, userId: string) {
  const startTime = Date.now();
  const startLimit = new Date(startDate);
  startLimit.setHours(0, 0, 0, 0);
  
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  // 1. Fetch all data needed for the simulation in bulk
  const [allTransactions, allPrices, allCashTransactions] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
      select: { date: true, type: true, quantity: true, pricePerUnit: true, grossAmount: true, assetId: true }
    }),
    prisma.dailyPrice.findMany({
      where: { asset: { userId } },
      orderBy: { date: 'asc' },
      select: { date: true, closePrice: true, assetId: true }
    }),
    prisma.cashTransaction.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
      select: { date: true, type: true, amount: true }
    })
  ]);

  // 2. Identify the true start of history to begin simulation
  const firstTxDate = allTransactions[0]?.date;
  const firstCashDate = allCashTransactions[0]?.date;
  
  let simDate = new Date(startLimit);
  if (firstTxDate && firstTxDate < simDate) simDate = new Date(firstTxDate);
  if (firstCashDate && firstCashDate < simDate) simDate = new Date(firstCashDate);
  
  // Normalize to UTC Midnight
  const currentSimDate = new Date(Date.UTC(simDate.getUTCFullYear(), simDate.getUTCMonth(), simDate.getUTCDate()));
  const utcToday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

  console.log(`[RecalcService] Starting simulation for user ${userId} from ${currentSimDate.toISOString()} (Snapshots from ${startLimit.toISOString()}).`);

  // 3. Simulation State
  let runningCash = 0;
  let runningCostBasis = 0;
  const runningQty = new Map<string, number>(); // assetId -> quantity
  const currentPrices = new Map<string, number>(); // assetId -> price

  // 4. Indexing events by UTC date string for O(1) access during day loop
  const formatDateKey = (d: Date) => d.toISOString().split('T')[0];
  
  const txsByDate = new Map<string, typeof allTransactions>();
  for (const tx of allTransactions) {
    const d = formatDateKey(tx.date);
    if (!txsByDate.has(d)) txsByDate.set(d, []);
    txsByDate.get(d)!.push(tx);
  }

  const pricesByDate = new Map<string, typeof allPrices>();
  for (const p of allPrices) {
    const d = formatDateKey(p.date);
    if (!pricesByDate.has(d)) pricesByDate.set(d, []);
    pricesByDate.get(d)!.push(p);
  }

  const cashByDate = new Map<string, typeof allCashTransactions>();
  for (const ctx of allCashTransactions) {
    const d = formatDateKey(ctx.date);
    if (!cashByDate.has(d)) cashByDate.set(d, []);
    cashByDate.get(d)!.push(ctx);
  }

  const upsertTasks: any[] = [];
  let daysProcessed = 0;

  // 5. Main Simulation Loop (Iterate day by day in UTC)
  while (currentSimDate <= utcToday) {
    const dateKey = formatDateKey(currentSimDate);

    // Apply Price Updates first (to value existing holdings at EOD price)
    const dayPrices = pricesByDate.get(dateKey);
    if (dayPrices) {
      for (const p of dayPrices) {
        currentPrices.set(p.assetId, p.closePrice);
      }
    }

    // Apply Asset Transactions
    const dayTxs = txsByDate.get(dateKey);
    if (dayTxs) {
      for (const tx of dayTxs) {
        const q = runningQty.get(tx.assetId) || 0;
        if (tx.type === 'BUY') {
          runningQty.set(tx.assetId, q + tx.quantity);
        } else if (tx.type === 'SELL') {
          runningQty.set(tx.assetId, Math.max(0, q - tx.quantity));
        }
        runningCostBasis -= tx.grossAmount;
      }
    }

    // Apply Cash Transactions
    const dayCash = cashByDate.get(dateKey);
    if (dayCash) {
      for (const ctx of dayCash) {
        const type = ctx.type as string;
        if (['DEPOSIT', 'DIVIDEND', 'INTEREST', 'SELL_ASSET'].includes(type)) {
          runningCash += ctx.amount;
        } else if (['WITHDRAWAL', 'BUY_ASSET'].includes(type)) {
          runningCash -= ctx.amount;
        }
      }
    }

    // Only generate snapshots from the requested startLimit onwards
    if (currentSimDate >= startLimit) {
      // Calculate Total Invested Value
      let investedValue = 0;
      for (const [assetId, qty] of runningQty.entries()) {
        if (qty > 0.000001) {
          const price = currentPrices.get(assetId) || 0;
          investedValue += qty * price;
        }
      }

      const totalValue = investedValue + runningCash;
      const snapshotDate = new Date(currentSimDate); // Already UTC midnight

      upsertTasks.push(prisma.portfolioSnapshot.upsert({
        where: { userId_date: { userId, date: snapshotDate } },
        update: { totalValue, investedValue, cashBalance: runningCash, costBasis: runningCostBasis },
        create: { userId, date: snapshotDate, totalValue, investedValue, cashBalance: runningCash, costBasis: runningCostBasis }
      }));
    }

    daysProcessed++;
    currentSimDate.setUTCDate(currentSimDate.getUTCDate() + 1);
  }

  // 6. Execute all upserts in a single transaction
  if (upsertTasks.length > 0) {
    // Process in chunks to avoid overwhelming the DB/transaction limit if range is huge
    const chunkSize = 50;
    for (let i = 0; i < upsertTasks.length; i += chunkSize) {
      const chunk = upsertTasks.slice(i, i + chunkSize);
      await prisma.$transaction(chunk);
    }
  }

  const duration = Date.now() - startTime;
  console.log(`[RecalcService] Optimized simulation completed in ${duration}ms. Processed ${daysProcessed} simulation days. Applied ${upsertTasks.length} snapshots.`);
}
