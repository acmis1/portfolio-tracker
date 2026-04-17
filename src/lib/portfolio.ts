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

  let totalValue = 0;
  let activeAssetCount = 0;
  const cashflows: { amount: string; date: string }[] = [];

  for (const asset of assets) {
    const quantity = asset.transactions.reduce((acc, tx) => {
      // In the schema, BUY quantity is added, SELL is subtracted
      if (tx.type === 'BUY') return acc + tx.quantity;
      if (tx.type === 'SELL') return acc - tx.quantity;
      return acc;
    }, 0);

    const latestPrice = asset.prices[0]?.closePrice || 0;
    const assetValue = quantity * latestPrice;
    
    if (quantity > 0.000001) { // Floating point safety
      activeAssetCount++;
      totalValue += assetValue;
    }

    // Add transactions to cashflows
    for (const tx of asset.transactions) {
      cashflows.push({
        amount: tx.grossAmount.toString(),
        date: tx.date.toISOString().split('T')[0]
      });
    }
  }

  // Terminal value: what is the portfolio worth TODAY?
  // This is treated as a final positive cash flow (cash entering the "user's pocket")
  if (totalValue > 0) {
    cashflows.push({
      amount: totalValue.toString(),
      date: new Date().toISOString().split('T')[0]
    });
  }

  let portfolioXirr = 0;
  // XIRR needs at least one negative and one positive cash flow to converge
  const hasNegative = cashflows.some(cf => parseFloat(cf.amount) < 0);
  const hasPositive = cashflows.some(cf => parseFloat(cf.amount) > 0);

  if (hasNegative && hasPositive && cashflows.length >= 2) {
    try {
      const result = xirr({ cashflows });
      if (result.ok) {
        portfolioXirr = result.value.toNumber() * 100; // @finprecise/cashflow returns Decimal
      }
    } catch (error) {
      console.error("XIRR calculation failed:", error);
    }
  }

  return {
    totalValue,
    xirr: portfolioXirr,
    assetCount: activeAssetCount
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
        // Weighted Average Cost formula: (old_qty * old_avg + new_qty * new_price) / new_total_qty
        avgCost = (currentQty * avgCost + tx.quantity * tx.pricePerUnit) / newQty;
        currentQty = newQty;
      } else if (tx.type === 'SELL') {
        // Sell reduces quantity but doesn't change average cost of remaining units
        currentQty = Math.max(0, currentQty - tx.quantity);
        if (currentQty === 0) {
          avgCost = 0; // Reset if fully sold
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
