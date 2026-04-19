import { prisma } from "@/lib/db";

export async function getLastSyncTime() {
  try {
    const lastPrice = await prisma.dailyPrice.findFirst({
      orderBy: {
        updatedAt: 'desc'
      },
      select: {
        updatedAt: true
      }
    });

    return lastPrice?.updatedAt || null;
  } catch (error) {
    console.error("Failed to fetch last sync time:", error);
    return null;
  }
}
