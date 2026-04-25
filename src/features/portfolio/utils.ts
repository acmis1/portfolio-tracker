import { auth } from "@clerk/nextjs/server";
import { getRawPortfolioData, getHistoryData, getAssetClassData } from "./queries";
import { calculatePortfolioSummary } from "./calculations/summary";
import { calculatePortfolioHistory } from "./calculations/history";
import { calculateAssetClassPerformance } from "./calculations/performance";
import { AssetHolding } from "./types";

export type { AssetHolding };
export type PortfolioSummary = Awaited<ReturnType<typeof getPortfolioSummaryInternal>>;

export async function getPortfolioSummary() {
  const { userId } = await auth();
  if (!userId) return getEmptySummary();
  return await getPortfolioSummaryInternal(userId);
}

export async function getPortfolioSummaryInternal(userId: string) {
  const { assets, cashTransactions, latestPrice } = await getRawPortfolioData(userId);
  return calculatePortfolioSummary(assets, cashTransactions, latestPrice?.date || null);
}

export async function getHoldingsLedger(): Promise<AssetHolding[]> {
  const { userId } = await auth();
  if (!userId) return [];
  const summary = await getPortfolioSummaryInternal(userId);
  return summary.holdings;
}

export async function getPortfolioHistory(days = 365) {
  const { userId } = await auth();
  if (!userId) return [];

  const assets = await getHistoryData(userId);
  if (assets.length === 0) return [];

  let earliestTxDate = new Date();
  assets.forEach((a: any) => {
    if (a.transactions.length > 0 && a.transactions[0].date < earliestTxDate) {
      earliestTxDate = new Date(a.transactions[0].date);
    }
  });
  earliestTxDate.setHours(0, 0, 0, 0);

  const today = new Date();
  const diffTime = Math.abs(today.getTime() - earliestTxDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  const daysToFetch = Math.max(days, diffDays);

  return calculatePortfolioHistory(assets, daysToFetch);
}

export async function getAssetClassPerformance() {
  const { userId } = await auth();
  if (!userId) return [];

  const assets = await getAssetClassData(userId);
  return calculateAssetClassPerformance(assets);
}

function getEmptySummary() {
  return {
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
  };
}
