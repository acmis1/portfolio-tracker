'use server'

import { prisma } from "@/lib/db"
import { Prisma } from "@prisma/client"
import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const targetAllocationSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['SYMBOL', 'CLASS']),
  symbol: z.string().optional().nullable(),
  assetClass: z.string().optional().nullable(),
  targetWeight: z.number().min(0).max(100)
})

export type TargetAllocationInput = z.infer<typeof targetAllocationSchema>

export async function upsertTargetAllocation(input: TargetAllocationInput) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const data = targetAllocationSchema.parse(input)

  try {
    // Determine the unique selector based on type
    const where: Prisma.TargetAllocationWhereUniqueInput = data.id 
      ? { id: data.id } 
      : data.type === 'SYMBOL'
        ? { userId_symbol: { userId, symbol: data.symbol! } }
        : { userId_assetClass: { userId, assetClass: data.assetClass! } };

    await prisma.targetAllocation.upsert({
      where,
      update: {
        type: data.type,
        symbol: data.symbol,
        assetClass: data.assetClass,
        targetWeight: Number(data.targetWeight),
        userId // Ensure userId is preserved
      },
      create: {
        userId,
        type: data.type,
        symbol: data.symbol,
        assetClass: data.assetClass,
        targetWeight: Number(data.targetWeight)
      }
    })

    revalidatePath('/rebalance')
    return { success: true }
  } catch (error) {
    console.error("Failed to upsert target allocation:", error)
    return { success: false, error: "Database operation failed" }
  }
}

export async function deleteTargetAllocation(id: string) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  try {
    await prisma.targetAllocation.delete({
      where: { id, userId }
    })
    revalidatePath('/rebalance')
    return { success: true }
  } catch (error) {
    console.error("Failed to delete target allocation:", error)
    return { success: false, error: "Deletion failed" }
  }
}

export async function getTargetAllocations() {
  const { userId } = await auth()
  if (!userId) return []

  return prisma.targetAllocation.findMany({
    where: { userId },
    orderBy: { type: 'asc' }
  })
}
