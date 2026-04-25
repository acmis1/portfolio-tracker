import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { calculatePortfolioSummary } from "@/features/portfolio/calculations/summary";

export async function getAssetDetail(assetId: string) {
  const { userId } = await auth();
  if (!userId) return null;

  const asset = await prisma.asset.findUnique({
    where: { id: assetId, userId },
    include: {
      transactions: {
        orderBy: { date: 'desc' }
      },
      prices: {
        orderBy: { date: 'desc' },
        take: 30 // Last 30 prices for some chart if needed
      },
      termDeposits: {
        orderBy: { startDate: 'desc' },
        take: 1
      }
    }
  });

  if (!asset) return null;

  // We can reuse the portfolio summary calculation by passing just this asset
  // and zeroing out other components
  const summary = calculatePortfolioSummary([asset], [], null);
  const holding = summary.holdings.find(h => h.id === assetId);

  return {
    asset,
    holding,
    transactions: asset.transactions,
    prices: asset.prices
  };
}
