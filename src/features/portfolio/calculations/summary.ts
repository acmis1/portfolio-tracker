import { xirr } from "@finprecise/cashflow";
import { AssetHolding, InvestmentHolding, CashHolding } from "../types";

export interface PortfolioSummaryResult {
  portfolioValue: number;
  cashBalance: number;
  netWorth: number;
  totalInvested: number;
  xirr: number;
  assetCount: number;
  totalRealizedPnL: number;
  lastPriceDate: Date | null;
  totalContributions: number;
  totalWithdrawals: number;
  totalPassiveIncome: number;
  netCashFlow: number;
  holdings: InvestmentHolding[];
  cashHolding: CashHolding | null;
}

export function calculatePortfolioSummary(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  assets: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cashTransactions: any[],
  latestPriceDate: Date | null
): PortfolioSummaryResult {
  let totalContributions = 0;
  let totalWithdrawals = 0;
  let totalPassiveIncome = 0;
  
  const cashBalance = cashTransactions.reduce((acc: number, // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: any) => {
    if (tx.type === 'DEPOSIT') totalContributions += tx.amount;
    if (tx.type === 'WITHDRAWAL') totalWithdrawals += tx.amount;
    if (['DIVIDEND', 'INTEREST'].includes(tx.type)) totalPassiveIncome += tx.amount;

    if (['DEPOSIT', 'DIVIDEND', 'INTEREST', 'SELL_ASSET'].includes(tx.type)) return acc + tx.amount;
    if (['WITHDRAWAL', 'BUY_ASSET'].includes(tx.type)) return acc - tx.amount;
    return acc;
  }, 0);

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
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((tx as any).realizedPnL) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        status: 'Active',
        quantity: currentQty,
        avgCost: runningAvgCost
      };
      
      let assetValue = 0;
      if (asset.assetClass === 'TERM_DEPOSIT' && asset.termDeposits[0]) {
        const td = asset.termDeposits[0];
        const effectiveEndDate = now < td.maturityDate ? now : td.maturityDate;
        const daysElapsed = Math.max(0, (effectiveEndDate.getTime() - td.startDate.getTime()) / (1000 * 60 * 60 * 24));
        const accruedInterest = (td.principal * (td.interestRate / 100) * daysElapsed) / 365;
        assetValue = td.principal + accruedInterest;
        const daysToMaturity = Math.ceil((td.maturityDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        holdings.push({
          ...baseData,
          type: 'TERM_DEPOSIT',
          marketValue: assetValue,
          quantity: 1,
          avgCost: td.principal,
          principal: td.principal,
          termDepositId: td.id,
          interestRate: td.interestRate,
          startDate: td.startDate,
          maturityDate: td.maturityDate,
          accruedInterest,
          daysToMaturity,
          unrealizedPnL: accruedInterest,
          unrealizedPnLPctg: td.interestRate,
          status: daysToMaturity <= 0 ? 'Matured — Action Required' : `Matures in ${daysToMaturity}d`,
        });
      }
 else if (asset.assetClass === 'REAL_ESTATE') {
        const livePrice = asset.prices[0]?.closePrice ?? runningAvgCost;
        assetValue = currentQty * livePrice;
        const appraisalAgeDays = asset.prices[0] 
          ? Math.floor((now.getTime() - asset.prices[0].date.getTime()) / (1000 * 60 * 60 * 24))
          : null;

        holdings.push({
          ...baseData,
          type: 'REAL_ESTATE',
          marketValue: assetValue,
          quantity: 1,
          avgCost: runningAvgCost,
          purchasePrice: runningAvgCost,
          currentValuation: livePrice,
          valuationDate: asset.prices[0]?.date ?? null,
          appraisalAgeDays,
          unrealizedPnL: livePrice - runningAvgCost,
          unrealizedPnLPctg: runningAvgCost > 0 ? ((livePrice - runningAvgCost) / runningAvgCost) * 100 : 0,
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
            livePrice,
            marketValue: assetValue,
            unrealizedPnL,
            unrealizedPnLPctg,
            unit: 'Tael',
            status: livePrice !== null ? 'Live' : 'Last Purchase',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any);
        } else {
          holdings.push({
            ...baseData,
            type: 'LIQUID',
            livePrice,
            marketValue: assetValue,
            unrealizedPnL,
            unrealizedPnLPctg,
            status: livePrice !== null ? 'Live' : 'Avg Cost Fallback',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any);
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
    const xirrCashflows = [...cashflows, {
      amount: portfolioValue.toString(),
      date: new Date().toISOString().split('T')[0]
    }];

    try {
      const result = xirr({ cashflows: xirrCashflows });
      if (result.ok) {
        portfolioXirr = result.value.toNumber() * 100;
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("XIRR calculation failed:", error);
    }
  }

  const holdingsWithWeights = holdings
    .filter(h => h.assetClass !== 'CASH')
    .map(h => ({
      ...h,
      weight: portfolioValue > 0 ? (h.marketValue / portfolioValue) * 100 : 0
    })).sort((a, b) => b.marketValue - a.marketValue);

  const cashHolding = Math.abs(cashBalance) > 0.01 ? {
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
  } : null;

  return {
    portfolioValue,
    cashBalance,
    netWorth,
    totalInvested,
    xirr: portfolioXirr,
    assetCount: activeAssetCount,
    totalRealizedPnL,
    lastPriceDate: latestPriceDate,
    totalContributions,
    totalWithdrawals,
    totalPassiveIncome,
    netCashFlow: totalContributions - totalWithdrawals,
    holdings: holdingsWithWeights as InvestmentHolding[],
    cashHolding: cashHolding as CashHolding | null
  };
}
