'use server'

import { prisma } from "@/lib/db";
import { getCashBalance } from "@/features/cash/actions";
import { AssetDrift, RebalancingSummary } from "../types";
import { revalidatePath } from "next/cache";
import { CashTransactionType } from "@prisma/client";

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
  const assetCalculations = assets.map(asset => {
    const quantity = asset.transactions.reduce((acc, tx) => {
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
  const drifts: AssetDrift[] = assetCalculations.map(calc => {
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
  drifts.sort((a, b) => Math.abs(b.drift) - Math.abs(a.drift));

  return {
    totalPortfolioValue,
    cashBalance,
    investedValue: totalInvestedValue,
    drifts
  };
}

export async function updateTargetWeight(assetId: string, newWeight: number) {
  try {
    await prisma.asset.update({
      where: { id: assetId },
      data: { targetWeight: newWeight }
    });

    revalidatePath('/rebalance');
    return { success: true };
  } catch (error) {
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
  const actionable = plan.filter(d => Math.abs(d.actionAmount) >= 1000);
  
  if (actionable.length === 0) {
    return { success: false, error: "No actionable trades found (threshold: 1000 VND)" };
  }

  try {
    await prisma.$transaction(async (tx) => {
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
              type: CashTransactionType.BUY_ASSET,
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
              type: CashTransactionType.SELL_ASSET,
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
