import { prisma } from "@/lib/db";
import { xirr } from "@finprecise/cashflow";
import { auth } from "@clerk/nextjs/server";
import { formatAssetClass } from "@/lib/formatters";

export async function getPortfolioSummary() {
  const { userId } = await auth()
  if (!userId) return {
    totalValue: 0,
    totalInvested: 0,
    xirr: 0,
    assetCount: 0,
    totalRealizedPnL: 0,
    lastPriceDate: null
  }

  return await getPortfolioSummaryInternal(userId)
}

export async function getPortfolioSummaryInternal(userId: string) {
  const assets = await prisma.asset.findMany({
    where: { userId },
    include: {
      transactions: true,
      prices: {
        orderBy: { date: 'desc' },
        take: 1
      },
      termDeposits: {
        take: 1,
        orderBy: { startDate: 'desc' }
      }
    }
  });

  const latestPrice = await prisma.dailyPrice.findFirst({
    where: { asset: { userId } },
    orderBy: { date: 'desc' }
  });

  let totalValue = 0;
  let totalInvested = 0;
  let totalRealizedPnL = 0;
  let activeAssetCount = 0;
  const cashflows: { amount: string; date: string }[] = [];
  const now = new Date();

  for (const asset of assets) {
    let currentQty = 0;
    for (const tx of asset.transactions) {
      if (tx.type === 'BUY') currentQty += tx.quantity;
      else if (tx.type === 'SELL') currentQty -= tx.quantity;
      
      const amount = Number(tx.grossAmount);
      totalInvested -= amount; 

      if ((tx as any).realizedPnL) {
        totalRealizedPnL += (tx as any).realizedPnL;
      }

      cashflows.push({
        amount: tx.grossAmount.toString(),
        date: tx.date.toISOString().split('T')[0]
      });
    }

    if (currentQty > 0.000001) {
      activeAssetCount++;
      
      let assetValue = 0;
      if (asset.assetClass === 'TERM_DEPOSIT' && asset.termDeposits[0]) {
        const td = asset.termDeposits[0];
        const daysElapsed = Math.max(0, (now.getTime() - td.startDate.getTime()) / (1000 * 60 * 60 * 24));
        const accruedInterest = (td.principal * (td.interestRate / 100) * daysElapsed) / 365;
        assetValue = td.principal + accruedInterest;
      } else {
        const currentPrice = asset.prices[0]?.closePrice || 0;
        assetValue = currentQty * currentPrice;
      }
      
      totalValue += assetValue;
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
    } catch (error: any) {
      console.error("XIRR calculation failed:", error);
    }
  }

  return {
    totalValue,
    totalInvested,
    xirr: portfolioXirr,
    assetCount: activeAssetCount,
    totalRealizedPnL,
    lastPriceDate: latestPrice?.date || null
  };
}


export type AssetHolding = 
  | (LiquidHolding & { type: 'LIQUID' })
  | (TermDepositHolding & { type: 'TERM_DEPOSIT' })
  | (RealEstateHolding & { type: 'REAL_ESTATE' })
  | (GoldHolding & { type: 'GOLD' });

interface BaseHolding {
  id: string;
  symbol: string;
  name: string;
  currency: string;
  assetClass: string;
  marketValue: number;
  weight: number;
  status: string;
}

interface LiquidHolding extends BaseHolding {
  quantity: number;
  avgCost: number;
  livePrice: number | null;
  unrealizedPnL: number | null;
  unrealizedPnLPctg: number | null;
}

interface TermDepositHolding extends BaseHolding {
  principal: number;
  interestRate: number;
  maturityDate: Date;
  accruedInterest: number;
  daysToMaturity: number;
}

interface RealEstateHolding extends BaseHolding {
  purchasePrice: number;
  currentValuation: number;
  valuationDate: Date | null;
  appraisalAgeDays: number | null;
}

interface GoldHolding extends BaseHolding {
  quantity: number; // weight in grams/tael
  avgCost: number;
  livePrice: number | null;
  unrealizedPnL: number | null;
  unrealizedPnLPctg: number | null;
  unit: string;
}

export async function getHoldingsLedger(): Promise<AssetHolding[]> {
  const { userId } = await auth()
  if (!userId) return []

  const assets = await prisma.asset.findMany({
    where: { userId },
    include: {
      transactions: {
        orderBy: { date: 'asc' }
      },
      prices: {
        orderBy: { date: 'desc' },
        take: 1
      },
      termDeposits: {
        take: 1,
        orderBy: { startDate: 'desc' }
      }
    }
  });

  const holdings: AssetHolding[] = [];
  const now = new Date();

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
      const baseData = {
        id: asset.id,
        symbol: asset.symbol,
        name: asset.name,
        currency: asset.currency,
        assetClass: asset.assetClass,
        weight: 0, // Calculated after loop
      };

      if (asset.assetClass === 'TERM_DEPOSIT') {
        const td = asset.termDeposits[0];
        if (td) {
          const daysElapsed = Math.max(0, (now.getTime() - td.startDate.getTime()) / (1000 * 60 * 60 * 24));
          const accruedInterest = (td.principal * (td.interestRate / 100) * daysElapsed) / 365;
          const marketValue = td.principal + accruedInterest;
          const daysToMaturity = Math.ceil((td.maturityDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          holdings.push({
            ...baseData,
            type: 'TERM_DEPOSIT',
            marketValue,
            principal: td.principal,
            interestRate: td.interestRate,
            maturityDate: td.maturityDate,
            accruedInterest,
            daysToMaturity,
            status: daysToMaturity <= 0 ? 'Matured' : `Matures in ${daysToMaturity}d`,
          });
        }
      } else if (asset.assetClass === 'REAL_ESTATE') {
        const livePrice = asset.prices[0]?.closePrice ?? avgCost;
        const marketValue = currentQty * livePrice;
        const appraisalAgeDays = asset.prices[0] 
          ? Math.floor((now.getTime() - asset.prices[0].date.getTime()) / (1000 * 60 * 60 * 24))
          : null;

        holdings.push({
          ...baseData,
          type: 'REAL_ESTATE',
          marketValue,
          purchasePrice: avgCost,
          currentValuation: livePrice,
          valuationDate: asset.prices[0]?.date ?? null,
          appraisalAgeDays,
          status: appraisalAgeDays !== null ? `Appraisal ${appraisalAgeDays}d old` : 'Manual Valuation',
        });
      } else if (asset.assetClass === 'GOLD') {
        const livePrice = asset.prices[0]?.closePrice ?? null;
        const marketValue = livePrice !== null ? currentQty * livePrice : currentQty * avgCost;
        const unrealizedPnL = livePrice !== null ? marketValue - (currentQty * avgCost) : null;
        const unrealizedPnLPctg = (livePrice !== null && avgCost > 0) 
          ? (unrealizedPnL! / (currentQty * avgCost)) * 100 
          : null;
        
        holdings.push({
          ...baseData,
          type: 'GOLD',
          quantity: currentQty,
          avgCost,
          livePrice,
          marketValue,
          unrealizedPnL,
          unrealizedPnLPctg,
          unit: 'Tael',
          status: livePrice !== null ? 'Live' : 'Last Purchase',
        });
      } else {
        const livePrice = asset.prices[0]?.closePrice ?? null;
        const marketValue = livePrice !== null ? currentQty * livePrice : currentQty * avgCost;
        const unrealizedPnL = livePrice !== null ? marketValue - (currentQty * avgCost) : null;
        const unrealizedPnLPctg = (livePrice !== null && avgCost > 0) 
          ? (unrealizedPnL! / (currentQty * avgCost)) * 100 
          : null;

        holdings.push({
          ...baseData,
          type: 'LIQUID',
          quantity: currentQty,
          avgCost,
          livePrice,
          marketValue,
          unrealizedPnL,
          unrealizedPnLPctg,
          status: livePrice !== null ? 'Live' : 'Avg Cost Fallback',
        });
      }
    }
  }

  const finalTotalValue = holdings.reduce((sum, h) => sum + h.marketValue, 0);
  return holdings.map(h => ({
    ...h,
    weight: finalTotalValue > 0 ? (h.marketValue / finalTotalValue) * 100 : 0
  })).sort((a, b) => b.marketValue - a.marketValue);
}

export async function getPortfolioHistory(days = 365) {
  const { userId } = await auth()
  if (!userId) return []

  // We fetch a generous amount of history by default to allow client-side range toggles
  const assets = await prisma.asset.findMany({
    where: { userId },
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
  assets.forEach((a: any) => {
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
        .filter((tx: any) => tx.date <= currentDate)
        .reduce((acc: any, tx: any) => {
          if (tx.type === 'BUY') return acc + tx.quantity;
          if (tx.type === 'SELL') return acc - tx.quantity;
          return acc;
        }, 0);

      if (quantityAtDate > 0.000001) {
        // Find the latest price on or before this date
        const priceAtDate = asset.prices
          .filter((p: any) => p.date <= currentDate)
          .sort((a: any, b: any) => b.date.getTime() - a.date.getTime())[0]?.closePrice || 0;

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

export async function getAssetClassPerformance() {
  const { userId } = await auth();
  if (!userId) return [];

  const assets = await prisma.asset.findMany({
    where: { userId },
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

  const buckets = {
    Equities: { marketValue: 0, netInvested: 0 },
    Gold: { marketValue: 0, netInvested: 0 },
    Crypto: { marketValue: 0, netInvested: 0 },
  };

  for (const asset of assets) {
    let bucketKey: keyof typeof buckets | null = null;
    
    // 1) Audit bucket string alignment
    if (asset.assetClass === 'STOCK' || asset.assetClass === 'MUTUAL_FUND') bucketKey = 'Equities';
    else if (asset.assetClass === 'GOLD') bucketKey = 'Gold';
    else if (asset.assetClass === 'CRYPTO') bucketKey = 'Crypto';

    if (!bucketKey) continue;

    let currentQty = 0;
    let avgCost = 0;
    let netInvestedForAsset = 0;

    for (const tx of asset.transactions) {
      const amount = Number(tx.grossAmount); // BUY is negative, SELL is positive in our ledger
      
      if (tx.type === 'BUY') {
        const newQty = currentQty + tx.quantity;
        if (newQty > 0) {
          avgCost = (currentQty * avgCost + tx.quantity * tx.pricePerUnit) / newQty;
        }
        currentQty = newQty;
        // BUY contributions should be positive for NetInvested (capital out)
        netInvestedForAsset -= amount; 
      } else if (tx.type === 'SELL') {
        // SELL contributions should reduce NetInvested (capital back)
        netInvestedForAsset -= amount;
        currentQty = Math.max(0, currentQty - tx.quantity);
        if (currentQty <= 0.000001) {
          avgCost = 0;
        }
      }
    }

    // 3) Audit price association and fallback behavior
    const livePrice = asset.prices[0]?.closePrice || 0;
    // Use live price if valid (> 0), otherwise fallback to avgCost for valuation
    const effectivePrice = livePrice > 0 ? livePrice : avgCost;
    
    buckets[bucketKey].marketValue += currentQty * effectivePrice;
    buckets[bucketKey].netInvested += netInvestedForAsset;
  }

  return Object.entries(buckets).map(([name, data]) => {
    // 2) Audit and fix ROI calculation
    // Safely handle cases where netInvested might be very small or negative (profit realized)
    // We use Math.abs to check if there's significant capital activity, but keep the sign for calculation
    const hasInvested = Math.abs(data.netInvested) > 0.01;
    
    let roi = 0;
    if (hasInvested) {
      roi = ((data.marketValue - data.netInvested) / data.netInvested) * 100;
      
      // If netInvested is negative (payouts > cost) and marketValue is 0, the math might be misleading
      // However, per requirement we follow (MV - Net) / Net
      // We flip sign if NetInvested is negative to keep ROI directionally correct (optional, but requested logic is strict)
      // Usually ROI = Profit / CapitalAtRisk. If netInvested is negative, capital at risk is effectively 0 or negative.
    }
    
    return {
      name,
      marketValue: data.marketValue,
      netInvested: data.netInvested,
      roi
    };
  });
}
