import { prisma } from "@/lib/db";
import { xirr } from "@finprecise/cashflow";

export async function getPortfolioSummary() {
  const assets = await prisma.asset.findMany({
    include: {
      transactions: true,
      prices: {
        orderBy: { date: 'desc' },
        take: 1
      }
    }
  });

  const latestPrice = await prisma.dailyPrice.findFirst({
    orderBy: { date: 'desc' }
  });

  let totalValue = 0;
  let totalInvested = 0;
  let activeAssetCount = 0;
  const cashflows: { amount: string; date: string }[] = [];

  for (const asset of assets) {
    const quantity = asset.transactions.reduce((acc, tx) => {
      if (tx.type === 'BUY') return acc + tx.quantity;
      if (tx.type === 'SELL') return acc - tx.quantity;
      return acc;
    }, 0);

    const currentPrice = asset.prices[0]?.closePrice || 0;
    const assetValue = quantity * currentPrice;
    
    if (quantity > 0.000001) {
      activeAssetCount++;
      totalValue += assetValue;
    }

    // Calculate total net invested capital (signed for cashflow)
    // BUY = negative (cash out), SELL = positive (cash in)
    // Total Invested = -(sum of these cashflows)
    for (const tx of asset.transactions) {
      const amount = Number(tx.grossAmount);
      totalInvested -= amount; // Subtracting a negative BUY increases totalInvested

      cashflows.push({
        amount: tx.grossAmount.toString(),
        date: tx.date.toISOString().split('T')[0]
      });
    }
  }

  if (totalValue > 0) {
    cashflows.push({
      amount: totalValue.toString(),
      date: new Date().toISOString().split('T')[0]
    });
  }

  let portfolioXirr = 0;
  const hasNegative = cashflows.some(cf => parseFloat(cf.amount) < 0);
  const hasPositive = cashflows.some(cf => parseFloat(cf.amount) > 0);

  if (hasNegative && hasPositive && cashflows.length >= 2) {
    try {
      const result = xirr({ cashflows });
      if (result.ok) {
        portfolioXirr = result.value.toNumber() * 100;
      }
    } catch (error) {
      console.error("XIRR calculation failed:", error);
    }
  }

  return {
    totalValue,
    totalInvested,
    xirr: portfolioXirr,
    assetCount: activeAssetCount,
    lastPriceDate: latestPrice?.date || null
  };
}


export async function getHoldingsLedger() {
  const assets = await prisma.asset.findMany({
    include: {
      transactions: {
        orderBy: { date: 'asc' }
      },
      prices: {
        orderBy: { date: 'desc' },
        take: 1
      }
    }
  });

  const holdings = [];

  for (const asset of assets) {
    let currentQty = 0;
    let avgCost = 0;
    for (const tx of asset.transactions) {
      if (tx.type === 'BUY') {
        const newQty = currentQty + tx.quantity;
        avgCost = (currentQty * avgCost + tx.quantity * tx.pricePerUnit) / newQty;
        currentQty = newQty;
      } else if (tx.type === 'SELL') {
        currentQty = Math.max(0, currentQty - tx.quantity);
        if (currentQty === 0) {
          avgCost = 0;
        }
      }
    }

    if (currentQty > 0.000001) {
      const livePrice = asset.prices[0]?.closePrice ?? null;
      const marketValue = livePrice !== null ? currentQty * livePrice : 0;
      const unrealizedPnL = livePrice !== null ? marketValue - (currentQty * avgCost) : null;
      const unrealizedPnLPctg = (livePrice !== null && avgCost > 0) 
        ? (unrealizedPnL! / (currentQty * avgCost)) * 100 
        : null;

      holdings.push({
        id: asset.id,
        symbol: asset.symbol,
        name: asset.name,
        currency: asset.currency,
        assetClass: asset.assetClass,
        quantity: currentQty,
        avgCost,
        livePrice,
        marketValue,
        unrealizedPnL,
        unrealizedPnLPctg,
      });
    }
  }

  return holdings;
}

export async function getPortfolioHistory(days = 365) {
  // We fetch a generous amount of history by default to allow client-side range toggles
  const assets = await prisma.asset.findMany({
    include: {
      transactions: {
        orderBy: { date: 'asc' }
      },
      prices: {
        orderBy: { date: 'asc' }
      }
    }
  });

  if (assets.length === 0) return [];

  // Find the earliest transaction date to avoid unnecessary empty days at the start of ALL range
  let earliestTxDate = new Date();
  assets.forEach(a => {
    if (a.transactions.length > 0 && a.transactions[0].date < earliestTxDate) {
      earliestTxDate = new Date(a.transactions[0].date);
    }
  });
  earliestTxDate.setHours(0, 0, 0, 0);

  const history = [];
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  // We loop from today backwards to [days] or earliestTxDate (whichever is later, or just use [days])
  // To support "ALL", we'll just use a large enough number or calculate it.
  const diffTime = Math.abs(today.getTime() - earliestTxDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  const daysToFetch = Math.max(days, diffDays);

  for (let i = daysToFetch - 1; i >= 0; i--) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() - i);
    currentDate.setHours(23, 59, 59, 999);

    let dailyTotalValue = 0;

    for (const asset of assets) {
      // Calculate quantity at this specific date
      const quantityAtDate = asset.transactions
        .filter(tx => tx.date <= currentDate)
        .reduce((acc, tx) => {
          if (tx.type === 'BUY') return acc + tx.quantity;
          if (tx.type === 'SELL') return acc - tx.quantity;
          return acc;
        }, 0);

      if (quantityAtDate > 0.000001) {
        // Find the latest price on or before this date
        const priceAtDate = asset.prices
          .filter(p => p.date <= currentDate)
          .sort((a, b) => b.date.getTime() - a.date.getTime())[0]?.closePrice || 0;

        dailyTotalValue += quantityAtDate * priceAtDate;
      }
    }

    history.push({
      date: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: dailyTotalValue
    });
  }

  return history;
}
