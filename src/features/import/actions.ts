'use server'

import { prisma } from "@/server/db"
import { auth } from "@clerk/nextjs/server"
import { RawImportRow } from "./types"
import { validateImportRow } from "./utils"
import { revalidatePath } from "next/cache"
import { recalculateAssetPnL, recalculateHistoricalSnapshots } from "../portfolio/actions/recalculate"

export async function bulkImportTransactions(rows: RawImportRow[]) {
  const { userId } = await auth()
  if (!userId) return { success: false, error: "Unauthorized" }

  // 1. Validation
  const validRows = rows.filter(row => validateImportRow(row).length === 0)
  if (validRows.length === 0) return { success: false, error: "No valid rows to import" }

  try {
    const assetIdsToRecalculate = new Set<string>()
    let earliestDate = new Date()

    await prisma.$transaction(async (tx) => {
      for (const row of validRows) {
        const dateObj = new Date(row.date)
        if (dateObj < earliestDate) earliestDate = dateObj

        if (row.category === 'ASSET' && row.symbol) {
          // Find or create asset
          let asset = await tx.asset.findFirst({
            where: { symbol: row.symbol, userId }
          })

          if (!asset) {
            asset = await tx.asset.create({
              data: {
                symbol: row.symbol,
                name: row.symbol, // Default name to symbol
                assetClass: 'EQUITY', // Default to equity
                currency: 'VND',
                userId,
              }
            })
          }

          assetIdsToRecalculate.add(asset.id)

          // Create cash transaction first
          const cashTx = await tx.cashTransaction.create({
            data: {
              amount: Math.abs(row.amount),
              date: dateObj,
              type: row.type === 'BUY' ? 'BUY_ASSET' : 'SELL_ASSET',
              description: `Bulk Import: ${row.type} ${row.quantity} ${row.symbol} @ ${row.price}`,
              currency: 'VND',
              userId,
            }
          })

          // Create asset transaction
          await tx.transaction.create({
            data: {
              assetId: asset.id,
              type: row.type as any,
              quantity: row.quantity || 0,
              pricePerUnit: row.price || 0,
              grossAmount: row.type === 'BUY' ? -Math.abs(row.amount) : Math.abs(row.amount),
              date: dateObj,
              cashTransactionId: cashTx.id,
              userId,
            }
          })
        } else {
          // Pure cash transaction
          await tx.cashTransaction.create({
            data: {
              amount: row.amount,
              date: dateObj,
              type: row.type as any,
              description: row.description || 'Bulk Import: Cash Operation',
              currency: 'VND',
              userId,
            }
          })
        }
      }
    }, {
      timeout: 30000 // Increase timeout for bulk operations
    })

    // 2. Recalculations (outside transaction for performance)
    for (const assetId of assetIdsToRecalculate) {
      await recalculateAssetPnL(assetId, userId)
    }
    await recalculateHistoricalSnapshots(earliestDate, userId)

    revalidatePath('/')
    return { success: true, count: validRows.length }
  } catch (error) {
    console.error("Bulk import failed:", error)
    return { success: false, error: "Database operation failed" }
  }
}
