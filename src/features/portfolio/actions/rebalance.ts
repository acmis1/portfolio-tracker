'use server'

import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { getCashBalanceInternal } from "@/features/cash/actions";
import { auth } from "@clerk/nextjs/server";
import { calculateRebalancePlan, Holding, Target, RebalancePlan, RebalanceNode } from "@/lib/math/rebalance";
import { revalidatePath } from "next/cache";

import { getPortfolioSummaryInternal } from "../utils";

/**
 * Institutional-grade grouping logic.
 * Enforces macro-bucket aggregation for Core/Satellite strategy.
 */
function getBucketName(assetClass: string) {
  if (['ETF', 'STOCK_FUND'].includes(assetClass)) {
    return 'Equities (Funds)';
  } else if (assetClass === 'BOND_FUND') {
    return 'Fixed Income';
  } else if (assetClass === 'CRYPTO') {
    return 'Cryptocurrency';
  } else if (assetClass === 'REAL_ESTATE') {
    return 'Real Estate';
  } else if (assetClass === 'TERM_DEPOSIT') {
    return 'Cash & Equivalents';
  } else if (assetClass === 'GOLD') {
    return 'Commodities';
  }
  return assetClass;
}

export type EnhancedRebalancePlan = RebalancePlan & {
  cashBalance: number;
  investedValue: number;
};

/**
 * The new, correct quantitative engine action.
 * Replaces the legacy getRebalancingDrift.
 */
export async function getRebalancePlan(): Promise<EnhancedRebalancePlan | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const [assets, targets, summary] = await Promise.all([
    prisma.asset.findMany({
      where: { userId },
      select: {
        id: true,
        symbol: true,
        name: true,
        assetClass: true,
        transactions: true,
        prices: { orderBy: { date: 'desc' }, take: 1 },
        termDeposits: {
          take: 1,
          orderBy: { startDate: 'desc' }
        }
      }
    }),
    prisma.targetAllocation.findMany({
      where: { userId }
    }),
    getPortfolioSummaryInternal(userId)
  ]);

  const cashBalance = summary.cashBalance;
  // AUM for rebalancing should include cash if cash is part of the allocation strategy
  const globalPortfolioAum = summary.portfolioValue + cashBalance;

  const symbolTargetsSet = new Set(targets.filter((t: any) => t.type === 'SYMBOL').map((t: any) => t.symbol));
  const aggregatedHoldings: Holding[] = [];
  const classAggregationMap = new Map<string, { value: number }>();

  assets.forEach((asset: any) => {
    let currentQty = 0;
    let avgCost = 0;
    asset.transactions.forEach((tx: any) => {
      if (tx.type === 'BUY') {
        const newQty = currentQty + tx.quantity;
        avgCost = (currentQty * avgCost + tx.quantity * tx.pricePerUnit) / newQty;
        currentQty = newQty;
      } else if (tx.type === 'SELL') {
        currentQty = Math.max(0, currentQty - tx.quantity);
        if (currentQty === 0) avgCost = 0;
      }
    });

    let value = 0;
    const livePrice = asset.prices[0]?.closePrice || 0;
    const price = livePrice > 0 ? livePrice : avgCost;

    if (asset.assetClass === 'TERM_DEPOSIT' && asset.termDeposits[0]) {
      const td = asset.termDeposits[0];
      const now = new Date();
      const daysElapsed = Math.max(0, (now.getTime() - td.startDate.getTime()) / (1000 * 60 * 60 * 24));
      const accruedInterest = (td.principal * (td.interestRate / 100) * daysElapsed) / 365;
      value = td.principal + accruedInterest;
    } else {
      value = currentQty * price;
    }

    if (symbolTargetsSet.has(asset.symbol) || asset.assetClass === 'INDIVIDUAL_STOCK') {
      aggregatedHoldings.push({
        assetId: asset.id,
        symbol: asset.symbol,
        name: asset.name,
        assetClass: asset.assetClass,
        quantity: asset.assetClass === 'TERM_DEPOSIT' ? 1 : currentQty,
        currentPrice: asset.assetClass === 'TERM_DEPOSIT' ? value : price
      });
    } else if (value > 0.01) {
      const bucketName = getBucketName(asset.assetClass);
      const existing = classAggregationMap.get(bucketName) || { value: 0 };
      classAggregationMap.set(bucketName, {
        value: existing.value + value
      });
    }
  });

  // Add liquid cash to 'Cash & Equivalents' bucket
  const cashBucket = 'Cash & Equivalents';
  const existingCash = classAggregationMap.get(cashBucket) || { value: 0 };
  classAggregationMap.set(cashBucket, {
    value: existingCash.value + cashBalance
  });

  classAggregationMap.forEach((data, bucketName) => {
    aggregatedHoldings.push({
      assetId: `CLASS:${bucketName}`,
      symbol: bucketName,
      name: bucketName,
      assetClass: bucketName,
      quantity: 1,
      currentPrice: data.value
    });
  });

  const targetList: Target[] = [];
  const classTargetsWeights = new Map<string, { weight: number, id: string }>();

  targets.forEach((t: any) => {
    if (t.type === 'CLASS' && t.assetClass) {
      const bucketName = getBucketName(t.assetClass);
      // We take the first ID found for a bucket if multiple exist (unlikely but safe)
      if (!classTargetsWeights.has(bucketName)) {
        classTargetsWeights.set(bucketName, { weight: 0, id: t.id });
      }
      const current = classTargetsWeights.get(bucketName)!;
      classTargetsWeights.set(bucketName, { 
        weight: current.weight + (t.targetWeight / 100),
        id: current.id 
      });
    } else if (t.type === 'SYMBOL' && t.symbol) {
      targetList.push({
        id: t.id,
        type: 'SYMBOL',
        symbol: t.symbol,
        targetWeight: t.targetWeight / 100
      });
    }
  });

  classTargetsWeights.forEach((data, assetClass) => {
    targetList.push({
      id: data.id,
      type: 'CLASS',
      assetClass,
      targetWeight: data.weight
    });
  });

  const plan = calculateRebalancePlan(aggregatedHoldings, targetList, globalPortfolioAum);

  return {
    ...plan,
    cashBalance,
    investedValue: summary.portfolioValue
  };
}

/**
 * Updates target allocations.
 */
export async function updateTargetWeight(key: string, newWeight: number) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

  const [type, value] = key.split(':');
  if (!type || !value) return { success: false, error: "Invalid allocation key" };

  try {
    if (newWeight === 0) {
      if (type === 'SYMBOL') {
        await prisma.targetAllocation.deleteMany({ where: { userId, symbol: value } });
      } else {
        await prisma.targetAllocation.deleteMany({ where: { userId, assetClass: value } });
      }
    } else {
      const weight = Number(newWeight);
      const existing = await prisma.targetAllocation.findFirst({
        where: type === 'SYMBOL' 
          ? { userId, symbol: value } 
          : { userId, assetClass: value }
      });

      if (existing) {
        await prisma.targetAllocation.update({
          where: { id: existing.id },
          data: { targetWeight: weight, type: type as any }
        });
      } else {
        await prisma.targetAllocation.create({
          data: { 
            userId, 
            targetWeight: weight, 
            type: type as any,
            symbol: type === 'SYMBOL' ? value : null,
            assetClass: type === 'CLASS' ? value : null
          }
        });
      }
    }
    revalidatePath('/rebalance');
    return { success: true };
  } catch (error) {
    return { success: false, error: "Database update failed" };
  }
}

/**
 * Executes rebalancing trades based on new node structure.
 */
export async function executeRebalancePlan(nodes: RebalanceNode[]) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

  const actionable = nodes.filter(n => Math.abs(n.deltaCash) >= 1000);
  if (actionable.length === 0) return { success: false, error: "No actionable trades found" };

  try {
    await prisma.$transaction(async (tx) => {
      for (const node of actionable) {
        const parts = node.key.split(':');
        let type = parts[0];
        let value = parts[1];

        if (type === 'UNMANAGED' && value === 'CLASS') {
          type = 'CLASS';
          value = parts[2];
        }

        if (type === 'SYMBOL' || type === 'UNMANAGED') {
          const asset = await tx.asset.findFirst({ where: { userId, symbol: node.symbol } });
          if (!asset) continue;
          await executeTrade(tx, userId, asset.id, node.symbol, node.deltaCash, node.currentPrice || 0);
        } else if (type === 'CLASS') {
          const allAssets = await tx.asset.findMany({
            where: { userId },
            select: {
              id: true, symbol: true, assetClass: true,
              transactions: true,
              prices: { orderBy: { date: 'desc' }, take: 1 }
            }
          });
          const classAssets = allAssets.filter((a: any) => getBucketName(a.assetClass) === value);
          const totalValue = classAssets.reduce((sum: any, a: any) => {
            const qty = a.transactions.reduce((acc: number, t: any) => t.type === 'BUY' ? acc + t.quantity : acc - t.quantity, 0);
            return sum + qty * (a.prices[0]?.closePrice || 0);
          }, 0);

          for (const asset of classAssets) {
            const currentQty = asset.transactions.reduce((acc: number, t: any) => 
              t.type === 'BUY' ? acc + t.quantity : acc - t.quantity, 0);
            const price = asset.prices[0]?.closePrice || 0;
            const assetValue = currentQty * price;
            const share = totalValue > 0 ? assetValue / totalValue : (1 / classAssets.length);
            const amount = node.deltaCash * share;
            
            if (Math.abs(amount) >= 1) {
              await executeTrade(tx, userId, asset.id, asset.symbol, amount, price);
            }
          }
        }
      }
    });

    revalidatePath('/');
    revalidatePath('/rebalance');
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Trade execution failed";
    return { success: false, error: message };
  }
}

async function executeTrade(tx: Prisma.TransactionClient, userId: string, assetId: string, symbol: string, amount: number, price: number) {
  if (price <= 0) return;
  const absAmount = Math.abs(amount);
  const quantity = absAmount / price;
  const date = new Date();

  await tx.transaction.create({
    data: {
      assetId, userId,
      type: amount > 0 ? 'BUY' : 'SELL',
      quantity, pricePerUnit: price,
      grossAmount: amount > 0 ? -absAmount : absAmount,
      date
    }
  });

  await tx.cashTransaction.create({
    data: {
      userId, amount: absAmount,
      type: amount > 0 ? 'BUY_ASSET' : 'SELL_ASSET',
      date,
      description: `Rebalance: ${amount > 0 ? 'Buy' : 'Sell'} ${symbol}`,
      referenceId: assetId
    }
  });
}

export async function getPortfolioSnapshots() {
  const { userId } = await auth();
  if (!userId) return [];
  const snapshots = await prisma.portfolioSnapshot.findMany({ where: { userId }, orderBy: { date: 'asc' } });
  return snapshots.map((s: any) => ({
    date: s.date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
    value: s.investedValue,
    invested: s.costBasis,
    netWorth: s.totalValue,
    fullDate: s.date
  }));
}

export async function forcePortfolioSnapshot() {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };
  return capturePortfolioSnapshotInternal(userId);
}

export async function capturePortfolioSnapshotInternal(userId: string) {
  const { getPortfolioSummaryInternal } = await import("../utils");
  const summary = await getPortfolioSummaryInternal(userId);

  const today = new Date();
  const midnight = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

  await prisma.portfolioSnapshot.upsert({
    where: { userId_date: { userId, date: midnight } },
    update: {
      totalValue: summary.netWorth,
      investedValue: summary.portfolioValue,
      cashBalance: summary.cashBalance,
      costBasis: summary.totalInvested
    },
    create: {
      userId, date: midnight,
      totalValue: summary.netWorth,
      investedValue: summary.portfolioValue,
      cashBalance: summary.cashBalance,
      costBasis: summary.totalInvested
    }
  });
  revalidatePath('/');
  return { success: true };
}
