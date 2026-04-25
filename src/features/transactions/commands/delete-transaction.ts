'use server'

import { prisma } from "@/server/db"
import { revalidatePath } from "next/cache"
import { auth } from "@clerk/nextjs/server"
import { recalculateAssetPnL, recalculateHistoricalSnapshots } from "../../portfolio/actions/recalculate"

export async function deleteTransaction(id: string) {
  const { userId } = await auth()
  if (!userId) return { success: false, error: "Unauthorized" }

  try {
    const transaction = await prisma.transaction.findFirst({
      where: { id, userId },
      include: { cashTransaction: true }
    })

    if (!transaction) return { success: false, error: "Transaction not found" }

    const assetId = transaction.assetId
    const date = transaction.date

    await prisma.$transaction(async (tx) => {
      if (transaction.cashTransactionId) {
        await tx.cashTransaction.delete({
          where: { id: transaction.cashTransactionId }
        })
      }

      await tx.transaction.delete({
        where: { id }
      })
    })

    await recalculateAssetPnL(assetId, userId)
    await recalculateHistoricalSnapshots(date, userId)

    revalidatePath('/')
    return { success: true }
  } catch (error: any) {
    console.error("Failed to delete transaction:", error)
    return { success: false, error: "Deletion failed" }
  }
}
