'use server'

import { prisma } from "@/lib/db";
import { getCashBalance } from "@/features/cash/actions";
import { AssetDrift, RebalancingSummary } from "../types";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";


/**
 * Calculates the deviation between current portfolio weights and target allocations.
 * Accounting Rules:
 * - Total Portfolio Value = Sum of all Asset Market Values + Unallocated Cash
 * - Current Weight = (Market Value / Total Portfolio Value) * 100
 * - Drift = Current Weight - Target Weight
 * - Target Value = Total Portfolio Value * (Target Weight / 100)
 * - Action Amount = Target Value - Market Value (Positive = BUY, Negative = SELL)
 */
export async function getRebalancingDrift(): Promise<RebalancingSummary> {
  const { userId } = await auth()
  if (!userId) return {
    drifts: [],
    cashBalance: 0,
    totalValue: 0,
    totalPortfolioValue: 0,
    investedValue: 0,
    currentYield: 0,
    targetYield: 0
  }

  // 1. Fetch assets with their holdings data
  const assets = await prisma.asset.findMany({
    include: {
      transactions: true,
      prices: {
        orderBy: { date: 'desc' },
        take: 1
      }
    }
  });

  // 2. Fetch unallocated cash balance
  const cashBalance = await getCashBalance();

  // 3. Process asset holdings and market values
  let totalInvestedValue = 0;
  const assetCalculations = assets.map((asset: any) => {
    const quantity = asset.transactions.reduce((acc: number, tx: any) => {
      if (tx.type === 'BUY') return acc + tx.quantity;
      if (tx.type === 'SELL') return acc - tx.quantity;
      return acc;
    }, 0);

    const price = asset.prices[0]?.closePrice || 0;
    const marketValue = quantity * price;

    totalInvestedValue += marketValue;

    return {
      assetId: asset.id,
      symbol: asset.symbol,
      name: asset.name,
      currentQuantity: quantity,
      currentPrice: price,
      marketValue,
      targetWeight: asset.targetWeight || 0,
    };
  });

  const totalPortfolioValue = totalInvestedValue + cashBalance;

  // 4. Calculate drifts and actions
  const drifts: AssetDrift[] = assetCalculations.map((calc: any) => {
    const currentWeight = totalPortfolioValue > 0 
      ? (calc.marketValue / totalPortfolioValue) * 100 
      : 0;
    
    const drift = currentWeight - calc.targetWeight;
    const targetValue = totalPortfolioValue * (calc.targetWeight / 100);
    const actionAmount = targetValue - calc.marketValue;

    return {
      ...calc,
      currentWeight,
      drift,
      targetValue,
      actionAmount
    };
  });

  // 5. Sort by absolute drift descending (most skewed first)
  drifts.sort((a: any, b: any) => Math.abs(b.drift) - Math.abs(a.drift));

  return {
    totalValue: totalPortfolioValue,
    totalPortfolioValue,
    cashBalance,
    investedValue: totalInvestedValue,
    drifts,
    currentYield: 0,
    targetYield: 0,
  };
}

export async function updateTargetWeight(assetId: string, newWeight: number) {
  const { userId } = await auth()
  if (!userId) return { success: false, error: "Unauthorized" }

  try {
    await prisma.asset.update({
      where: { id: assetId },
      data: { targetWeight: newWeight }
    });

    revalidatePath('/rebalance');
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update target weight:", error);
    return { success: false, error: "Database update failed" };
  }
}

/**
 * Bulk settles planned trades.
 * - Filters for actions > 1000 VND.
 * - Atomic transaction ensures Asset and Cash ledgers stay in sync.
 * - Derived quantities use the provided currentPrice (latest known).
 */
export async function executeRebalancePlan(plan: AssetDrift[]) {
  const { userId } = await auth()
  if (!userId) return { success: false, error: "Unauthorized" }

  const actionable = plan.filter((d: any) => Math.abs(d.actionAmount) >= 1000);
  
  if (actionable.length === 0) {
    return { success: false, error: "No actionable trades found (threshold: 1000 VND)" };
  }

  try {
    await prisma.$transaction(async (tx: any) => {
      for (const drift of actionable) {
        // We use the price provided in the drift (latest price from getRebalancingDrift)
        const price = drift.currentPrice;
        if (price <= 0) {
          throw new Error(`Execution failed: Missing or invalid price for ${drift.symbol}`);
        }

        const actionAmount = drift.actionAmount;
        const absAmount = Math.abs(actionAmount);
        const quantity = absAmount / price;
        const date = new Date();

        if (actionAmount > 0) {
          // BUY: Asset qty increases, Cash decreases
          await tx.transaction.create({
            data: {
              assetId: drift.assetId,
              type: 'BUY',
              quantity,
              pricePerUnit: price,
              grossAmount: -absAmount,
              date
            }
          });

          await tx.cashTransaction.create({
            data: {
              amount: absAmount,
              type: 'BUY_ASSET',
              date,
              description: `Rebalance: Buy ${drift.symbol}`,
              referenceId: drift.assetId
            }
          });
        } else {
          // SELL: Asset qty decreases, Cash increases
          await tx.transaction.create({
            data: {
              assetId: drift.assetId,
              type: 'SELL',
              quantity,
              pricePerUnit: price,
              grossAmount: absAmount,
              date
            }
          });

          await tx.cashTransaction.create({
            data: {
              amount: absAmount,
              type: 'SELL_ASSET',
              date,
              description: `Rebalance: Sell ${drift.symbol}`,
              referenceId: drift.assetId
            }
          });
        }
      }
    });

    revalidatePath('/');
    revalidatePath('/rebalance');
    return { success: true };
  } catch (error: any) {
    console.error("Settlement failed:", error);
    return { success: false, error: error.message || "Failed to settle rebalancing plan" };
  }
}

import { getPortfolioSummary } from "../utils";

/**
 * Fetches historical portfolio snapshots for charting.
 * Includes Net Invested (Cost Basis) and Total Value.
 */
export async function getPortfolioSnapshots() {
  const { userId } = await auth()
  if (!userId) return []

  try {
    const snapshots = await prisma.portfolioSnapshot.findMany({
      orderBy: { date: 'asc' }
    });
    
    return snapshots.map((s: any) => ({
      date: s.date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      value: s.totalValue,
      invested: s.costBasis, // Net Invested Capital (Cost Basis)
      marketValue: s.investedValue, // Current Market Value of assets
      fullDate: s.date
    }));
  } catch (error: any) {
    console.error("Failed to fetch portfolio snapshots:", error);
    return [];
  }
}

/**
 * Internal logic for capturing a portfolio snapshot.
 * Used by both secured server actions and public webhooks (with their own auth).
 */
export async function capturePortfolioSnapshot() {
  const summary = await getPortfolioSummary();
  const drift = await getRebalancingDriftInternal(); // We need a non-auth version of this too

  const now = new Date();
  const todayMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  await prisma.portfolioSnapshot.upsert({
    where: { date: todayMidnight },
    update: {
      totalValue: drift.totalPortfolioValue,
      investedValue: drift.investedValue,
      cashBalance: drift.cashBalance,
      costBasis: summary.totalInvested,
    },
    create: {
      date: todayMidnight,
      totalValue: drift.totalPortfolioValue,
      investedValue: drift.investedValue,
      cashBalance: drift.cashBalance,
      costBasis: summary.totalInvested,
    },
  });
}

/**
 * Manually triggers a portfolio snapshot capture.
 * Reuses the same valuation logic as the summary and cron route.
 */
export async function forcePortfolioSnapshot() {
  const { userId } = await auth()
  if (!userId) return { success: false, error: "Unauthorized" }

  try {
    await capturePortfolioSnapshot();
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error("Manual snapshot failed:", error);
    return { success: false, error: error.message || "Failed to capture snapshot" };
  }
}

/**
 * Internal version of getRebalancingDrift that skips Clerk auth.
 * Used by system processes (webhooks) that have their own security.
 */
export async function getRebalancingDriftInternal(): Promise<RebalancingSummary> {
  // 1. Fetch assets with their holdings data
  const assets = await prisma.asset.findMany({
    include: {
      transactions: true,
      prices: {
        orderBy: { date: 'desc' },
        take: 1
      }
    }
  });

  // 2. Fetch unallocated cash balance
  // We need an internal version of getCashBalance too if it checks auth
  const { getCashBalanceInternal } = await import("@/features/cash/actions");
  const cashBalance = await getCashBalanceInternal();

  // 3. Process asset holdings and market values
  let totalInvestedValue = 0;
  const assetCalculations = assets.map((asset: any) => {
    const quantity = asset.transactions.reduce((acc: number, tx: any) => {
      if (tx.type === 'BUY') return acc + tx.quantity;
      if (tx.type === 'SELL') return acc - tx.quantity;
      return acc;
    }, 0);

    const price = asset.prices[0]?.closePrice || 0;
    const marketValue = quantity * price;

    totalInvestedValue += marketValue;

    return {
      assetId: asset.id,
      symbol: asset.symbol,
      name: asset.name,
      currentQuantity: quantity,
      currentPrice: price,
      marketValue,
      targetWeight: asset.targetWeight || 0,
    };
  });

  const totalPortfolioValue = totalInvestedValue + cashBalance;

  // 4. Calculate drifts and actions
  const drifts: AssetDrift[] = assetCalculations.map((calc: any) => {
    const currentWeight = totalPortfolioValue > 0 
      ? (calc.marketValue / totalPortfolioValue) * 100 
      : 0;
    
    const drift = currentWeight - calc.targetWeight;
    const targetValue = totalPortfolioValue * (calc.targetWeight / 100);
    const actionAmount = targetValue - calc.marketValue;

    return {
      ...calc,
      currentWeight,
      drift,
      targetValue,
      actionAmount
    };
  });

  // 5. Sort by absolute drift descending (most skewed first)
  drifts.sort((a: any, b: any) => Math.abs(b.drift) - Math.abs(a.drift));

  return {
    totalPortfolioValue,
    cashBalance,
    investedValue: totalInvestedValue,
    drifts
  };
}
