import { prisma } from "@/lib/db";

export async function getRawPortfolioData(userId: string) {
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

  const latestPrice = await prisma.dailyPrice.findFirst({
    where: { asset: { userId } },
    orderBy: { date: 'desc' }
  });

  return { assets, cashTransactions, latestPrice };
}

export async function getAssetClassData(userId: string) {
  return prisma.asset.findMany({
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
}

export async function getHistoryData(userId: string) {
  return prisma.asset.findMany({
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
}
