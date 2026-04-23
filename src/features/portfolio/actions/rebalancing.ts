'use server'
// Refreshing Prisma client after schema update
import { prisma } from "@/lib/db";
import { getCashBalance, getCashBalanceInternal } from "@/features/cash/actions";
import { AssetDrift, RebalancingSummary } from "../types";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { calculateRebalancePlan, Holding, Target, RebalanceNode } from "@/lib/math/rebalance";
import { formatMacroCategory } from "@/lib/formatters";

const EMPTY_SUMMARY: RebalancingSummary = {
  drifts: [],
  cashBalance: 0,
  totalValue: 0,
  totalPortfolioValue: 0,
  investedValue: 0,
  currentYield: 0,
  targetYield: 0
};

/**
 * Calculates the deviation between current portfolio weights and target allocations.
 * Now supports Symbol-based and Class-based target buckets.
 */
export async function getRebalancePlan(): Promise<RebalancingSummary> {
  const { userId } = await auth();
  if (!userId) return EMPTY_SUMMARY;

  return getRebalancingDriftInternal(userId);
}

/**
 * Internal version of getRebalancingDrift that skips Clerk auth.
 */
export async function getRebalancingDriftInternal(userId: string): Promise<RebalancingSummary> {
  // 1. Fetch data
  const [assets, targets, cashBalance] = await Promise.all([
    prisma.asset.findMany({
      where: { userId },
      select: {
        id: true,
        symbol: true,
        name: true,
        assetClass: true,
        transactions: true,
        prices: { orderBy: { date: 'desc' }, take: 1 }
      }
    }),
    prisma.targetAllocation.findMany({
      where: { userId }
    }),
    getCashBalanceInternal(userId)
  ]);

  // Helper for strict grouping logic
  const getBucketName = (assetClass: string) => {
    let bucketName = assetClass; 
    if (['ETF', 'STOCK_FUND'].includes(assetClass)) {
      bucketName = 'Equities (Funds)';
    } else if (assetClass === 'BOND_FUND') {
      bucketName = 'Fixed Income';
    } else if (assetClass === 'CRYPTO') {
      bucketName = 'Cryptocurrency';
    } else if (assetClass === 'REAL_ESTATE') {
      bucketName = 'Real Estate';
    } else if (assetClass === 'TERM_DEPOSIT') {
      bucketName = 'Cash & Equivalents';
    } else if (assetClass === 'GOLD') {
      bucketName = 'Commodities';
    }
    return bucketName;
  };

  // 2. Map to math engine holdings
  const holdings: Holding[] = assets.map(asset => ({
    assetId: asset.id,
    symbol: asset.symbol,
    name: asset.name,
    assetClass: getBucketName(asset.assetClass),
    quantity: asset.transactions.reduce((acc, tx) => {
      if (tx.type === 'BUY') return acc + tx.quantity;
      if (tx.type === 'SELL') return acc - tx.quantity;
      return acc;
    }, 0),
    currentPrice: asset.prices[0]?.closePrice || 0
  }));

  const targetList: Target[] = [];
  const classTargetsMap = new Map<string, number>();

  targets.forEach(t => {
    if (t.type === 'CLASS' && t.assetClass) {
      const bucketName = getBucketName(t.assetClass);
      classTargetsMap.set(bucketName, (classTargetsMap.get(bucketName) || 0) + (t.targetWeight / 100));
    } else if (t.type === 'SYMBOL' && t.symbol) {
      targetList.push({
        type: 'SYMBOL',
        symbol: t.symbol,
        targetWeight: t.targetWeight / 100
      });
    }
  });

  classTargetsMap.forEach((weight, assetClass) => {
    targetList.push({
      type: 'CLASS',
      assetClass,
      targetWeight: weight
    });
  });

  const totalCurrentAssetValue = holdings.reduce(
    (sum, pos) => sum + pos.quantity * pos.currentPrice, 
    0
  );
  const globalPortfolioAum = cashBalance + totalCurrentAssetValue;

  // 3. Execute math engine
  const plan = calculateRebalancePlan(holdings, targetList, globalPortfolioAum);

  // 4. Map back to UI type (AssetDrift)
  const drifts: AssetDrift[] = plan.nodes.map(node => {
    const currentWeight = (node.currentValue / plan.totalAum) * 100;
    const targetWeight = (node.targetValue / plan.totalAum) * 100;

    const [type, key] = node.key.split(':');
    
    // Determine the readable display name
    let displayName = node.name;
    if (type === 'CLASS') {
      displayName = key; // Because key is the bucketName
    } else if (type === 'SYMBOL') {
      displayName = node.symbol; // Objective 2: "If the allocation is a SYMBOL, output the ticker (e.g., 'VCB', 'BTC')"
    } else if (type === 'UNMANAGED') {
      displayName = `${node.name} (Unmanaged)`;
    }

    return {
      assetId: node.key, // Key format: "SYMBOL:BTC", "CLASS:Cryptocurrency", "UNMANAGED:id"
      type: type as 'SYMBOL' | 'CLASS' | 'UNMANAGED',
      symbol: node.symbol,
      name: displayName,
      currentQuantity: node.deltaShares || 0,
      currentPrice: node.currentPrice || 0,
      marketValue: node.currentValue,
      targetWeight,
      currentWeight,
      drift: currentWeight - targetWeight,
      targetValue: node.targetValue,
      actionAmount: node.deltaCash
    };
  });

  // Sort by absolute drift descending (most skewed first)
  drifts.sort((a, b) => Math.abs(b.drift) - Math.abs(a.drift));

  const totalInvestedValue = holdings.reduce((sum, h) => sum + h.quantity * h.currentPrice, 0);

  return {
    totalValue: plan.totalAum,
    totalPortfolioValue: plan.totalAum,
    cashBalance,
    investedValue: totalInvestedValue,
    drifts,
    currentYield: 0,
    targetYield: 0,
  };
}

/**
 * Updates or creates a TargetAllocation for a specific bucket.
 * Key format: "SYMBOL:BTC" or "CLASS:CRYPTO"
 */
export async function updateTargetWeight(key: string, newWeight: number) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

  const [type, value] = key.split(':');
  if (!type || !value) return { success: false, error: "Invalid allocation key" };

  try {
    if (newWeight === 0) {
      // If weight is set to 0, we treat it as unmanaged/removed from targets
      if (type === 'SYMBOL') {
        await prisma.targetAllocation.deleteMany({
          where: { userId, symbol: value }
        });
      } else {
        await prisma.targetAllocation.deleteMany({
          where: { userId, assetClass: value }
        });
      }
    } else {
      if (type === 'SYMBOL') {
        await prisma.targetAllocation.upsert({
          where: { userId_symbol: { userId, symbol: value } },
          update: { targetWeight: newWeight, type: 'SYMBOL' },
          create: { userId, symbol: value, targetWeight: newWeight, type: 'SYMBOL' }
        });
      } else if (type === 'CLASS') {
        await prisma.targetAllocation.upsert({
          where: { userId_assetClass: { userId, assetClass: value } },
          update: { targetWeight: newWeight, type: 'CLASS' },
          create: { userId, assetClass: value, targetWeight: newWeight, type: 'CLASS' }
        });
      }
    }

    revalidatePath('/rebalance');
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update target allocation:", error);
    return { success: false, error: "Database update failed" };
  }
}

/**
 * Executes the rebalancing trades.
 * - For SYMBOL and UNMANAGED nodes, trades are executed on the specific asset.
 * - For CLASS nodes, the trade amount is distributed proportionally among assets in that class.
 */
export async function executeRebalancePlan(plan: AssetDrift[]) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

  const actionable = plan.filter(d => Math.abs(d.actionAmount) >= 1000);
  if (actionable.length === 0) return { success: false, error: "No actionable trades found" };

  try {
    await prisma.$transaction(async (tx: any) => {
      for (const drift of actionable) {
        const [type, value] = drift.assetId.split(':');

        if (type === 'SYMBOL' || type === 'UNMANAGED') {
          // Find the actual asset record
          const asset = await tx.asset.findFirst({
            where: { userId, symbol: drift.symbol }
          });
          if (!asset) continue;

          await executeTrade(tx, userId, asset.id, drift.symbol, drift.actionAmount, drift.currentPrice);
        } else if (type === 'CLASS') {
          // Distribute class trade among holdings
          const classAssets = await tx.asset.findMany({
            where: { userId, assetClass: value },
            select: {
              id: true,
              symbol: true,
              transactions: true,
              prices: { orderBy: { date: 'desc' }, take: 1 }
            }
          });

          const totalClassValue = classAssets.reduce((sum: number, a: any) => {
            const qty = a.transactions.reduce((acc: number, t: any) => t.type === 'BUY' ? acc + t.quantity : acc - t.quantity, 0);
            return sum + qty * (a.prices[0]?.closePrice || 0);
          }, 0);

          for (const asset of classAssets) {
            const qty = asset.transactions.reduce((acc: number, t: any) => t.type === 'BUY' ? acc + t.quantity : acc - t.quantity, 0);
            const price = asset.prices[0]?.closePrice || 0;
            const marketValue = qty * price;
            
            // Proportional distribution
            const share = totalClassValue > 0 ? marketValue / totalClassValue : (1 / classAssets.length);
            const assetActionAmount = drift.actionAmount * share;

            if (Math.abs(assetActionAmount) >= 1) {
              await executeTrade(tx, userId, asset.id, asset.symbol, assetActionAmount, price);
            }
          }
        }
      }
    });

    revalidatePath('/');
    revalidatePath('/rebalance');
    return { success: true };
  } catch (error: any) {
    console.error("Execution failed:", error);
    return { success: false, error: error.message || "Execution failed" };
  }
}

/**
 * Shared helper to create transaction and cash records.
 */
async function executeTrade(tx: any, userId: string, assetId: string, symbol: string, actionAmount: number, price: number) {
  if (price <= 0) return;
  
  const absAmount = Math.abs(actionAmount);
  const quantity = absAmount / price;
  const date = new Date();

  await tx.transaction.create({
    data: {
      assetId,
      userId,
      type: actionAmount > 0 ? 'BUY' : 'SELL',
      quantity,
      pricePerUnit: price,
      grossAmount: actionAmount > 0 ? -absAmount : absAmount,
      date
    }
  });

  await tx.cashTransaction.create({
    data: {
      userId,
      amount: absAmount,
      type: actionAmount > 0 ? 'BUY_ASSET' : 'SELL_ASSET',
      date,
      description: `Rebalance: ${actionAmount > 0 ? 'Buy' : 'Sell'} ${symbol}`,
      referenceId: assetId
    }
  });
}

export async function getPortfolioSnapshots() {
  const { userId } = await auth()
  if (!userId) return []

  try {
    const snapshots = await prisma.portfolioSnapshot.findMany({
      where: { userId },
      orderBy: { date: 'asc' }
    });
    
    return snapshots.map((s: any) => ({
      date: s.date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      value: s.totalValue,
      invested: s.costBasis,
      marketValue: s.investedValue,
      fullDate: s.date
    }));
  } catch (error: any) {
    console.error("Failed to fetch snapshots:", error);
    return [];
  }
}

export async function forcePortfolioSnapshot() {
  const { userId } = await auth()
  if (!userId) return { success: false, error: "Unauthorized" }
  return capturePortfolioSnapshotInternal(userId);
}

export async function capturePortfolioSnapshotInternal(userId: string) {
  try {
    const { getPortfolioSummaryInternal } = await import("../utils");
    const summary = await getPortfolioSummaryInternal(userId);
    const drift = await getRebalancingDriftInternal(userId);

    const now = new Date();
    const todayMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    await prisma.portfolioSnapshot.upsert({
      where: { 
        userId_date: {
          userId,
          date: todayMidnight 
        }
      },
      update: {
        totalValue: drift.totalPortfolioValue || 0,
        investedValue: drift.investedValue || 0,
        cashBalance: drift.cashBalance || 0,
        costBasis: summary.totalInvested,
      },
      create: {
        userId,
        date: todayMidnight,
        totalValue: drift.totalPortfolioValue || 0,
        investedValue: drift.investedValue || 0,
        cashBalance: drift.cashBalance || 0,
        costBasis: summary.totalInvested,
      },
    });

    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error("Snapshot capture failed:", error);
    return { success: false, error: error.message || "Failed to capture snapshot" };
  }
}
