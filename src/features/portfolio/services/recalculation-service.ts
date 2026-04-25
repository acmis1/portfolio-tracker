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
 * Pure service implementation.
 */
export async function recalculateHistoricalSnapshotsService(startDate: Date, userId: string) {
  const startTime = Date.now();
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  // Fetch all data needed for the simulation, scoped to the user
  const [assets, cashTransactions] = await Promise.all([
    prisma.asset.findMany({
      where: { userId },
      select: {
        id: true,
        transactions: { orderBy: { date: 'asc' } },
        prices: { orderBy: { date: 'asc' } }
      }
    }),
    prisma.cashTransaction.findMany({
      where: { userId },
      orderBy: { date: 'asc' }
    })
  ]);

  const totalAssets = assets.length;
  const totalCashTxs = cashTransactions.length;
  let daysProcessed = 0;
  let upsertCount = 0;

  console.log(`[RecalcService] recalculateHistoricalSnapshots for user ${userId} starting from ${start.toISOString()}.`);
  console.log(`[RecalcService] Loaded ${totalAssets} assets and ${totalCashTxs} cash transactions.`);

  const currentDate = new Date(start);
  
  while (currentDate <= today) {
    const dayEnd = new Date(currentDate);
    dayEnd.setHours(23, 59, 59, 999);

    // 1. Calculate Cash Balance as of dayEnd
    const cashBalance = cashTransactions
      .filter(tx => tx.date <= dayEnd)
      .reduce((acc, tx) => {
        const type = tx.type as string;
        if (['DEPOSIT', 'DIVIDEND', 'INTEREST', 'SELL_ASSET'].includes(type)) {
          return acc + tx.amount;
        } else if (['WITHDRAWAL', 'BUY_ASSET'].includes(type)) {
          return acc - tx.amount;
        }
        return acc;
      }, 0);

    // 2. Calculate Asset Value and Cost Basis as of dayEnd
    let investedValue = 0;
    let costBasis = 0;

    for (const asset of assets) {
      const txsAtDate = asset.transactions.filter(tx => tx.date <= dayEnd);
      
      const quantity = txsAtDate.reduce((acc, tx) => {
        if (tx.type === 'BUY') return acc + tx.quantity;
        if (tx.type === 'SELL') return acc - tx.quantity;
        return acc;
      }, 0);

      if (quantity > 0.000001) {
        // Find latest price on or before this date
        const priceAtDate = asset.prices
          .filter(p => p.date <= dayEnd)
          .sort((a, b) => b.date.getTime() - a.date.getTime())[0]?.closePrice || 0;
        
        investedValue += quantity * priceAtDate;
      }

      // Cost basis is net cash put into the assets
      costBasis += txsAtDate.reduce((acc, tx) => acc - tx.grossAmount, 0);
    }

    // 3. Upsert Snapshot for this specific UTC date
    const snapshotDate = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate()));
    
    await prisma.portfolioSnapshot.upsert({
      where: { 
        userId_date: {
          userId,
          date: snapshotDate 
        }
      },
      update: {
        totalValue: investedValue + cashBalance,
        investedValue,
        cashBalance,
        costBasis
      },
      create: {
        userId,
        date: snapshotDate,
        totalValue: investedValue + cashBalance,
        investedValue,
        cashBalance,
        costBasis
      }
    });

    upsertCount++;
    daysProcessed++;
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const duration = Date.now() - startTime;
  console.log(`[RecalcService] recalculateHistoricalSnapshots completed in ${duration}ms. Processed ${daysProcessed} days with ${upsertCount} upserts.`);
}
