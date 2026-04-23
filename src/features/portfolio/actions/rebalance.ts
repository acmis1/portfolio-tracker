'use server'

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { getCashBalance } from "@/features/cash/actions";
import { calculateRebalancePlan, ManagedPosition } from "@/lib/math/rebalance";

/**
 * Server Action: getRebalancePlan
 * 
 * Orchestrates the rebalancing calculation by:
 * 1. Fetching managed assets (targetWeight != null).
 * 2. Resolving live market prices with database fallbacks.
 * 3. Integrating cash balances.
 * 4. Executing the pure math engine.
 */
export async function getRebalancePlan() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // 1. Fetch assets with explicit target weights
  const assets = await prisma.asset.findMany({
    where: { 
      userId,
      targetWeight: { not: null }
    },
    include: {
      transactions: true,
      prices: {
        orderBy: { date: 'desc' },
        take: 1
      }
    }
  });

  // 2. Fetch current cash liquidity
  const cashBalance = await getCashBalance();

  // 3. Resolve Live Prices with fallback to last recorded price
  const managedPositions: ManagedPosition[] = await Promise.all(
    assets.map(async (asset) => {
      // Calculate current holding quantity
      const quantity = asset.transactions.reduce((acc, tx) => {
        if (tx.type === 'BUY') return acc + tx.quantity;
        if (tx.type === 'SELL') return acc - tx.quantity;
        return acc;
      }, 0);

      // Default to last known price in DB
      let currentPrice = asset.prices[0]?.closePrice || 0;

      // Attempt live price fetch via Yahoo Finance V8
      if (asset.symbol) {
        try {
          const livePrice = await fetchLivePrice(asset.symbol);
          if (livePrice) {
            currentPrice = livePrice;
          }
        } catch (e) {
          console.warn(`[Rebalance] Live price fetch failed for ${asset.symbol}. Using fallback price.`);
        }
      }

      return {
        symbol: asset.symbol,
        assetClass: asset.assetClass,
        quantity,
        currentPrice,
        targetWeight: asset.targetWeight!
      };
    })
  );

  // 4. Run the rebalancing math engine
  return calculateRebalancePlan(managedPositions, cashBalance);
}

/**
 * Internal helper to fetch regular market price from Yahoo Finance V8 API
 */
async function fetchLivePrice(symbol: string): Promise<number | null> {
  const ticker = encodeURIComponent(symbol);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1m&range=1d`;
  
  try {
    const res = await fetch(url, {
      next: { revalidate: 300 }, // 5-minute stale-while-revalidate
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
      }
    });

    if (!res.ok) return null;

    const data = await res.json();
    const meta = data.chart?.result?.[0]?.meta;
    
    return meta?.regularMarketPrice || null;
  } catch (err) {
    return null;
  }
}
