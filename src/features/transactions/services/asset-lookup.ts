'use server'

import { prisma } from "@/server/db"
import { auth } from "@clerk/nextjs/server"

export async function getUserAssets() {
  const { userId } = await auth()
  if (!userId) return []

  return prisma.asset.findMany({
    where: { userId },
    select: {
      id: true,
      symbol: true,
      name: true,
      assetClass: true,
      currency: true,
    }
  })
}
