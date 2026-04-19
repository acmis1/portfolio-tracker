'use server'

import { prisma } from "@/lib/db";
import { xirr } from "@finprecise/cashflow";
import { revalidatePath } from "next/cache";

export async function getAssetDetails(id: string) {
  const asset = await prisma.asset.findUnique({
    where: { id },
    include: {
      transactions: {
        orderBy: { date: 'desc' }
      },
      prices: {
        orderBy: { date: 'asc' }
      }
    }
  });

  if (!asset) return null;

  // Calculate holding metrics
  let currentQty = 0;
  let avgCost = 0;
  
  // Need to process transactions in chronological order (asc) for avg cost, 
  // but the include above was desc for the table view. 
  // We'll re-sort a copy for calculations.
  const chronTransactions = [...asset.transactions].sort((a, b) => a.date.getTime() - b.date.getTime());

  for (const tx of chronTransactions) {
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

  const livePrice = asset.prices.length > 0 ? asset.prices[asset.prices.length - 1].closePrice : null;
  const marketValue = livePrice !== null ? currentQty * livePrice : 0;
  const unrealizedPnL = livePrice !== null ? marketValue - (currentQty * avgCost) : null;
  const unrealizedPnLPctg = (livePrice !== null && avgCost > 0) 
    ? (unrealizedPnL! / (currentQty * avgCost)) * 100 
    : null;

  // Calculate Asset-Specific XIRR
  let assetXirr = null;
  const cashflows: { amount: string; date: string }[] = asset.transactions.map((tx: any) => ({
    amount: tx.grossAmount.toString(),
    date: tx.date.toISOString().split('T')[0]
  }));

  // Append terminal value as final inflow
  if (marketValue > 0) {
    cashflows.push({
      amount: marketValue.toString(),
      date: new Date().toISOString().split('T')[0]
    });
  }

  const hasNegative = cashflows.some(cf => parseFloat(cf.amount) < 0);
  const hasPositive = cashflows.some(cf => parseFloat(cf.amount) > 0);

  if (hasNegative && hasPositive && cashflows.length >= 2) {
    try {
      const result = xirr({ cashflows });
      if (result.ok) {
        assetXirr = result.value.toNumber() * 100;
      }
    } catch (error: any) {
      console.error(`XIRR calculation failed for asset ${id}:`, error);
    }
  }

  return {
    ...asset,
    holding: {
      quantity: currentQty,
      avgCost,
      livePrice,
      marketValue,
      unrealizedPnL,
      unrealizedPnLPctg,
      xirr: assetXirr,
    }
  };
}
export async function addPriceUpdate(data: { symbol: string; date: string; price: number; currency: string }) {
  const { symbol, date, price: rawPrice, currency } = data;
  const dateObj = new Date(date);
  dateObj.setHours(0, 0, 0, 0);

  const { getLiveExchangeRate } = await import("@/lib/fx");
  const USD_VND_RATE = await getLiveExchangeRate();
  const price = currency === 'USD' ? rawPrice * USD_VND_RATE : rawPrice;

  try {
    const asset = await prisma.asset.findFirst({
      where: { symbol: symbol.toUpperCase() }
    });

    if (!asset) {
      return { success: false, error: `Asset ${symbol} not found. Add a transaction first.` };
    }

    await prisma.dailyPrice.upsert({
      where: {
        assetId_date: {
          assetId: asset.id,
          date: dateObj
        }
      },
      update: {
        closePrice: price,
        source: 'manual'
      },
      create: {
        assetId: asset.id,
        date: dateObj,
        closePrice: price,
        source: 'manual'
      }
    });

    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update price:", error);
    return { success: false, error: "Database operation failed" };
  }
}
