'use server'

import { prisma } from "@/server/db"
import { revalidatePath } from "next/cache"
import { auth } from "@clerk/nextjs/server"
import { recalculateAssetPnL, recalculateHistoricalSnapshots } from "../../portfolio/actions/recalculate"

import { ActionResult } from "../types"

export async function deleteTransaction(id: string): Promise<ActionResult> {
  const { userId } = await auth()
  if (!userId) return { success: false, error: "Unauthorized" }

  try {
    const transaction = await prisma.transaction.findFirst({
      where: { id, userId },
      include: { 
        cashTransaction: true,
        asset: {
          include: {
            termDeposits: true
          }
        }
      }
    })

    if (!transaction) return { success: false, error: "Transaction not found" }

    // Task F: Block deleting transactions for resolved Term Deposits
    const isResolvedTD = transaction.asset.termDeposits.some(td => td.resolvedAt !== null)
    if (isResolvedTD) {
      return { 
        success: false, 
        error: "Resolved term deposit transactions cannot be deleted yet. Use a dedicated reversal workflow." 
      }
    }

    if (transaction.conversionId) {
      return {
        success: false,
        error: "Conversion transactions cannot be deleted individually yet. Use a dedicated conversion reversal workflow."
      }
    }

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
    revalidatePath('/holdings')
    revalidatePath(`/holdings/${assetId}`)
    revalidatePath('/ledger')
    revalidatePath('/rebalance')
    
    return { success: true }
  } catch (error) {
    console.error("Failed to delete transaction:", error)
    const message = error instanceof Error ? error.message : "Deletion failed"
    return { success: false, error: message }
  }
}
