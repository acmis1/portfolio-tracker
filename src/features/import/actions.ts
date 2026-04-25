'use server'

import { prisma } from "@/server/db"
import { auth } from "@clerk/nextjs/server"
import { RawImportRow, ImportPreviewRow, ImportSummary } from "./types"
import { validateImportRow } from "./utils"
import { revalidatePath } from "next/cache"
import { recalculateAssetPnL, recalculateHistoricalSnapshots } from "../portfolio/actions/recalculate"

export async function validateAndPreviewImport(rows: RawImportRow[]): Promise<{ 
  preview: ImportPreviewRow[], 
  summary: ImportSummary 
}> {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  // Fetch all user assets for matching
  const assets = await prisma.asset.findMany({
    where: { userId }
  })

  const preview: ImportPreviewRow[] = []
  const summary: ImportSummary = {
    totalRows: rows.length,
    validRows: 0,
    invalidRows: 0,
    duplicateRows: 0,
    newAssets: 0,
    matchedAssets: 0,
    totalAmount: 0
  }

  // Pre-fetch transactions for the date range of the import to check for duplicates
  const dates = rows.map(r => new Date(r.date)).filter(d => !isNaN(d.getTime()))
  if (dates.length === 0) return { preview: [], summary }
  
  const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))

  const existingTxs = await prisma.transaction.findMany({
    where: { 
      userId,
      date: { gte: minDate, lte: maxDate }
    },
    include: { asset: true }
  })

  const existingCashTxs = await prisma.cashTransaction.findMany({
    where: {
      userId,
      date: { gte: minDate, lte: maxDate }
    }
  })

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const errors = validateImportRow(row)
    const dateObj = new Date(row.date)
    
    let status: ImportPreviewRow['status'] = errors.length > 0 ? 'INVALID' : 'VALID'
    let matchedAssetId: string | undefined
    let matchedAssetName: string | undefined
    let isNewAsset = false

    if (status === 'VALID') {
      summary.validRows++
      summary.totalAmount += Math.abs(row.amount)

      if (row.category === 'ASSET' && row.symbol) {
        const symbolToMatch = row.symbol // Already uppercase from parseCSV
        
        // Match asset by symbol (exact) or name (fuzzy/exact)
        const asset = assets.find(a => 
          a.symbol === symbolToMatch || 
          a.name.toLowerCase() === symbolToMatch.toLowerCase()
        )

        if (asset) {
          matchedAssetId = asset.id
          matchedAssetName = asset.name
          summary.matchedAssets++
        } else {
          isNewAsset = true
          summary.newAssets++
        }

        // Check for duplicate transaction
        const isDuplicate = existingTxs.some(tx => 
          tx.date.getTime() === dateObj.getTime() &&
          tx.asset.symbol === (asset?.symbol || symbolToMatch) &&
          Math.abs(tx.quantity - (row.quantity || 0)) < 0.0001 &&
          Math.abs(tx.pricePerUnit - (row.price || 0)) < 1
        )

        if (isDuplicate) {
          status = 'DUPLICATE'
          summary.duplicateRows++
        }
      } else {
        // Cash transaction duplicate check
        const isDuplicate = existingCashTxs.some(tx => 
          tx.date.getTime() === dateObj.getTime() &&
          tx.type === (row.type as any) &&
          Math.abs(tx.amount - row.amount) < 1
        )

        if (isDuplicate) {
          status = 'DUPLICATE'
          summary.duplicateRows++
        }
      }
    } else {
      summary.invalidRows++
    }

    preview.push({
      ...row,
      id: `preview-${i}`,
      status,
      errors,
      matchedAssetId,
      matchedAssetName,
      isNewAsset
    })
  }

  return { preview, summary }
}

export async function bulkImportTransactions(rows: ImportPreviewRow[]) {
  const { userId } = await auth()
  if (!userId) return { success: false, error: "Unauthorized" }

  const rowsToImport = rows.filter(row => row.status === 'VALID' || row.status === 'MAPPED')
  if (rowsToImport.length === 0) return { success: false, error: "No new valid rows to import" }

  try {
    const assetIdsToRecalculate = new Set<string>()
    let earliestDate = new Date()
    const assetCache = new Map<string, string>()

    await prisma.$transaction(async (tx) => {
      for (const row of rowsToImport) {
        const dateObj = new Date(row.date)
        if (dateObj < earliestDate) earliestDate = dateObj

        if (row.category === 'ASSET' && row.symbol) {
          const symbolToUse = row.symbol
          let assetId = row.matchedAssetId

          if (!assetId) {
            assetId = assetCache.get(symbolToUse)
            
            if (!assetId) {
              let asset = await tx.asset.findFirst({
                where: { symbol: symbolToUse, userId }
              })

              if (!asset) {
                asset = await tx.asset.create({
                  data: {
                    symbol: symbolToUse,
                    name: symbolToUse,
                    assetClass: 'EQUITY',
                    currency: 'VND',
                    userId,
                  }
                })
              }
              assetId = asset.id
              assetCache.set(symbolToUse, assetId)
            }
          }

          assetIdsToRecalculate.add(assetId)

          const cashTx = await tx.cashTransaction.create({
            data: {
              amount: Math.abs(row.amount),
              date: dateObj,
              type: row.type === 'BUY' ? 'BUY_ASSET' : 'SELL_ASSET',
              description: row.description || `Import: ${row.type} ${row.quantity} ${symbolToUse}`,
              currency: 'VND',
              userId,
            }
          })

          await tx.transaction.create({
            data: {
              assetId,
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
          await tx.cashTransaction.create({
            data: {
              amount: row.amount,
              date: dateObj,
              type: row.type as any,
              description: row.description || 'Import: Cash Operation',
              currency: 'VND',
              userId,
            }
          })
        }
      }
    }, {
      timeout: 60000
    })

    for (const assetId of assetIdsToRecalculate) {
      await recalculateAssetPnL(assetId, userId)
    }
    await recalculateHistoricalSnapshots(earliestDate, userId)

    revalidatePath('/')
    return { success: true, count: rowsToImport.length }
  } catch (error) {
    console.error("Bulk import failed:", error)
    return { success: false, error: "Import failed due to database error" }
  }
}
