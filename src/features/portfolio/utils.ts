import { prisma } from "@/lib/db";
import { xirr } from "@finprecise/cashflow";
import { auth } from "@clerk/nextjs/server";
import { formatAssetClass } from "@/lib/formatters";

export async function getPortfolioSummary() {
  const { userId } = await auth()
  if (!userId) return {
    portfolioValue: 0,
    cashBalance: 0,
    netWorth: 0,
    totalInvested: 0,
    xirr: 0,
    assetCount: 0,
    totalRealizedPnL: 0,
    lastPriceDate: null,
    totalContributions: 0,
    totalWithdrawals: 0,
    totalPassiveIncome: 0,
    netCashFlow: 0,
    holdings: [],
    cashHolding: null
  }

  return await getPortfolioSummaryInternal(userId)
}

export type PortfolioSummary = Awaited<ReturnType<typeof getPortfolioSummaryInternal>>;


export async function getPortfolioSummaryInternal(userId: string) {
  const [assets, cashTransactions] = await Promise.all([
    prisma.asset.findMany({
      where: { userId },
      select: {
        id: true,
        symbol: true,
        name: true,
        assetClass: true,
        currency: true,
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
    }),
    prisma.cashTransaction.findMany({
      where: { userId }
    })
  ]);

  let totalContributions = 0;
  let totalWithdrawals = 0;
  let totalPassiveIncome = 0;
  
  const cashBalance = cashTransactions.reduce((acc: number, tx: any) => {
    if (tx.type === 'DEPOSIT') totalContributions += tx.amount;
    if (tx.type === 'WITHDRAWAL') totalWithdrawals += tx.amount;
    if (['DIVIDEND', 'INTEREST'].includes(tx.type)) totalPassiveIncome += tx.amount;

    if (['DEPOSIT', 'DIVIDEND', 'INTEREST', 'SELL_ASSET'].includes(tx.type)) return acc + tx.amount;
    if (['WITHDRAWAL', 'BUY_ASSET'].includes(tx.type)) return acc - tx.amount;
    return acc;
  }, 0);

  const latestPrice = await prisma.dailyPrice.findFirst({
    where: { asset: { userId } },
    orderBy: { date: 'desc' }
  });

  let portfolioValue = 0;
  let totalInvested = 0;
  let totalRealizedPnL = 0;
  let activeAssetCount = 0;
  const cashflows: { amount: string; date: string }[] = [];
  const now = new Date();

  const holdings: AssetHolding[] = [];

  for (const asset of assets) {
    let currentQty = 0;
    let netInvestedForAsset = 0;
    let runningAvgCost = 0;

    for (const tx of asset.transactions) {
      if (tx.type === 'BUY') {
        const newQty = currentQty + tx.quantity;
        runningAvgCost = (currentQty * runningAvgCost + tx.quantity * tx.pricePerUnit) / newQty;
        currentQty = newQty;
      } else if (tx.type === 'SELL') {
        currentQty = Math.max(0, currentQty - tx.quantity);
        if (currentQty === 0) runningAvgCost = 0;
      }
      
      if ((tx as any).realizedPnL) {
        totalRealizedPnL += (tx as any).realizedPnL;
      }

      const amount = Number(tx.grossAmount);
      netInvestedForAsset -= amount;

      cashflows.push({
        amount: tx.grossAmount.toString(),
        date: tx.date.toISOString().split('T')[0]
      });
    }

    totalInvested += netInvestedForAsset;

    if (currentQty > 0.000001) {
      activeAssetCount++;
      const baseData = {
        id: asset.id,
        symbol: asset.symbol,
        name: asset.name,
        currency: asset.currency,
        assetClass: asset.assetClass,
        weight: 0,
        status: 'Active'
      };
      
      let assetValue = 0;
      if (asset.assetClass === 'TERM_DEPOSIT' && asset.termDeposits[0]) {
        const td = asset.termDeposits[0];
        const daysElapsed = Math.max(0, (now.getTime() - td.startDate.getTime()) / (1000 * 60 * 60 * 24));
        const accruedInterest = (td.principal * (td.interestRate / 100) * daysElapsed) / 365;
        assetValue = td.principal + accruedInterest;
        const daysToMaturity = Math.ceil((td.maturityDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        holdings.push({
          ...baseData,
          type: 'TERM_DEPOSIT',
          marketValue: assetValue,
          principal: td.principal,
          interestRate: td.interestRate,
          maturityDate: td.maturityDate,
          accruedInterest,
          daysToMaturity,
          status: daysToMaturity <= 0 ? 'Matured' : `Matures in ${daysToMaturity}d`,
        });
      } else if (asset.assetClass === 'REAL_ESTATE') {
        const livePrice = asset.prices[0]?.closePrice ?? runningAvgCost;
        assetValue = currentQty * livePrice;
        const appraisalAgeDays = asset.prices[0] 
          ? Math.floor((now.getTime() - asset.prices[0].date.getTime()) / (1000 * 60 * 60 * 24))
          : null;

        holdings.push({
          ...baseData,
          type: 'REAL_ESTATE',
          marketValue: assetValue,
          purchasePrice: runningAvgCost,
          currentValuation: livePrice,
          valuationDate: asset.prices[0]?.date ?? null,
          appraisalAgeDays,
          status: appraisalAgeDays !== null ? `Appraisal ${appraisalAgeDays}d old` : 'Manual Valuation',
        });
      } else {
        const livePrice = asset.prices[0]?.closePrice ?? null;
        assetValue = livePrice !== null ? currentQty * livePrice : currentQty * runningAvgCost;
        const unrealizedPnL = livePrice !== null ? assetValue - (currentQty * runningAvgCost) : null;
        const unrealizedPnLPctg = (livePrice !== null && runningAvgCost > 0) 
          ? (unrealizedPnL! / (currentQty * runningAvgCost)) * 100 
          : null;

        if (asset.assetClass === 'GOLD') {
          holdings.push({
            ...baseData,
            type: 'GOLD',
            quantity: currentQty,
            avgCost: runningAvgCost,
            livePrice,
            marketValue: assetValue,
            unrealizedPnL,
            unrealizedPnLPctg,
            unit: 'Tael',
            status: livePrice !== null ? 'Live' : 'Last Purchase',
          });
        } else {
          holdings.push({
            ...baseData,
            type: 'LIQUID',
            quantity: currentQty,
            avgCost: runningAvgCost,
            livePrice,
            marketValue: assetValue,
            unrealizedPnL,
            unrealizedPnLPctg,
            status: livePrice !== null ? 'Live' : 'Avg Cost Fallback',
          });
        }
      }
      
      portfolioValue += assetValue;
    }
  }

  const netWorth = portfolioValue + cashBalance;

  let portfolioXirr = 0;
  const hasNegative = cashflows.some(cf => parseFloat(cf.amount) < 0);
  const hasPositive = cashflows.some(cf => parseFloat(cf.amount) > 0);

  if (hasNegative && hasPositive && cashflows.length >= 2) {
    // Add terminal value for XIRR calculation (Total Market Value of Assets)
    // We use portfolioValue here because cash is handled separately in the ledger
    const xirrCashflows = [...cashflows, {
      amount: portfolioValue.toString(),
      date: new Date().toISOString().split('T')[0]
    }];

    try {
      const result = xirr({ cashflows: xirrCashflows });
      if (result.ok) {
        portfolioXirr = result.value.toNumber() * 100;
      }
    } catch (error: any) {
      console.error("XIRR calculation failed:", error);
    }
  }

  // Finalize weights based on Portfolio Market Value (Assets Only)
  const holdingsWithWeights = holdings
    .filter(h => h.assetClass !== 'CASH')
    .map(h => ({
      ...h,
      weight: portfolioValue > 0 ? (h.marketValue / portfolioValue) * 100 : 0
    })).sort((a, b) => b.marketValue - a.marketValue);

  return {
    portfolioValue,
    cashBalance,
    netWorth,
    totalInvested,
    xirr: portfolioXirr,
    assetCount: activeAssetCount,
    totalRealizedPnL,
    lastPriceDate: latestPrice?.date || null,
    totalContributions,
    totalWithdrawals,
    totalPassiveIncome,
    netCashFlow: totalContributions - totalWithdrawals,
    holdings: holdingsWithWeights,
    cashHolding: Math.abs(cashBalance) > 0.01 ? {
      id: 'cash-balance',
      symbol: 'CASH',
      name: 'Cash Balance',
      currency: 'VND',
      assetClass: 'CASH',
      type: 'CASH' as const,
      marketValue: cashBalance,
      balance: cashBalance,
      quantity: 1,
      weight: 0,
      status: cashBalance >= 0 ? 'Liquid' : 'Overdrawn',
    } : null
  };
}


export type AssetHolding = 
  | (LiquidHolding & { type: 'LIQUID' })
  | (TermDepositHolding & { type: 'TERM_DEPOSIT' })
  | (RealEstateHolding & { type: 'REAL_ESTATE' })
  | (GoldHolding & { type: 'GOLD' })
  | (CashHolding & { type: 'CASH' });

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

interface CashHolding extends BaseHolding {
  balance: number;
  quantity: number;
}

export async function getHoldingsLedger(): Promise<AssetHolding[]> {
  const { userId } = await auth()
  if (!userId) return []
  const summary = await getPortfolioSummaryInternal(userId);
  return summary.holdings;
}

export async function getPortfolioHistory(days = 365) {
  const { userId } = await auth()
  if (!userId) return []

  // We fetch a generous amount of history by default to allow client-side range toggles
  const assets = await prisma.asset.findMany({
    where: { userId },
    select: {
      id: true,
      assetClass: true,
      transactions: {
        orderBy: { date: 'asc' }
      },
      prices: {
        orderBy: { date: 'asc' }
      },
      termDeposits: true
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
        let assetValue = 0;

        if (asset.assetClass === 'TERM_DEPOSIT') {
          const td = asset.termDeposits.find((t: any) => t.startDate <= currentDate);
          if (td) {
            const daysElapsed = Math.max(0, (currentDate.getTime() - td.startDate.getTime()) / (1000 * 60 * 60 * 24));
            const accruedInterest = (td.principal * (td.interestRate / 100) * daysElapsed) / 365;
            assetValue = td.principal + accruedInterest;
          }
        } else {
          // Find the latest price on or before this date
          const priceAtDate = asset.prices
            .filter((p: any) => p.date <= currentDate)
            .sort((a: any, b: any) => b.date.getTime() - a.date.getTime())[0]?.closePrice;

          if (priceAtDate !== undefined && priceAtDate !== null) {
            assetValue = quantityAtDate * priceAtDate;
          } else {
            // Fallback to avg cost on that date
            let avgCostAtDate = 0;
            let runningQtyAtDate = 0;
            for (const tx of asset.transactions) {
              if (tx.date <= currentDate) {
                if (tx.type === 'BUY') {
                  const newQty = runningQtyAtDate + tx.quantity;
                  avgCostAtDate = (runningQtyAtDate * avgCostAtDate + tx.quantity * tx.pricePerUnit) / newQty;
                  runningQtyAtDate = newQty;
                } else if (tx.type === 'SELL') {
                  runningQtyAtDate = Math.max(0, runningQtyAtDate - tx.quantity);
                  if (runningQtyAtDate === 0) avgCostAtDate = 0;
                }
              }
            }
            assetValue = quantityAtDate * avgCostAtDate;
          }
        }

        dailyTotalValue += assetValue;
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
    select: {
      id: true,
      assetClass: true,
      symbol: true,
      name: true,
      transactions: {
        orderBy: { date: 'asc' }
      },
      prices: {
        orderBy: { date: 'desc' },
        take: 1
      }
    }
  });

  const buckets: Record<string, { marketValue: number, netInvested: number }> = {
    Equities: { marketValue: 0, netInvested: 0 },
    'Fixed Income': { marketValue: 0, netInvested: 0 },
    Gold: { marketValue: 0, netInvested: 0 },
    Crypto: { marketValue: 0, netInvested: 0 },
    'Real Estate': { marketValue: 0, netInvested: 0 },
  };

  for (const asset of assets) {
    let bucketKey: string | null = null;
    
    if (['INDIVIDUAL_STOCK', 'ETF', 'STOCK_FUND'].includes(asset.assetClass)) bucketKey = 'Equities';
    else if (asset.assetClass === 'GOLD') bucketKey = 'Gold';
    else if (asset.assetClass === 'CRYPTO') bucketKey = 'Crypto';
    else if (asset.assetClass === 'BOND_FUND') bucketKey = 'Fixed Income';
    else if (asset.assetClass === 'REAL_ESTATE') bucketKey = 'Real Estate';

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
