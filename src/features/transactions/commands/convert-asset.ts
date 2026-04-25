'use server'

import { prisma } from "@/server/db"
import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { assetConversionSchema, AssetConversionValues } from "@/lib/validations"
import { recalculateAssetPnL, recalculateHistoricalSnapshots } from "../../portfolio/actions/recalculate"

import { Prisma } from "@prisma/client"

/**
 * Helper to calculate the source asset's weighted average VND cost basis 
 * and available quantity as of a specific date.
 */
async function getAssetCostBasisAsOf(assetId: string, userId: string, date: Date) {
  // Use pricePerUnit + fees (derived from absolute grossAmount) for BUY basis
  const transactions = await prisma.transaction.findMany({
    where: { 
      assetId, 
      userId,
      date: { lte: date }
    },
    orderBy: [
      { date: 'asc' },
      { id: 'asc' } // Deterministic sort for same-day transactions
    ]
  })

  let currentQty = 0
  let currentAvgCost = 0

  for (const tx of transactions) {
    if (tx.type === 'BUY') {
      const newQty = currentQty + tx.quantity
      if (newQty > 0) {
        // Use Math.abs(tx.grossAmount) to include fees in the cost basis
        const totalCostVnd = Math.abs(Number(tx.grossAmount))
        currentAvgCost = (currentQty * currentAvgCost + totalCostVnd) / newQty
      }
      currentQty = newQty
    } else if (tx.type === 'SELL') {
      currentQty = Math.max(0, currentQty - tx.quantity)
      if (currentQty === 0) {
        currentAvgCost = 0
      }
    }
  }

  return {
    availableQuantity: currentQty,
    avgCostVnd: currentAvgCost,
  }
}

export async function convertAsset(input: AssetConversionValues) {
  const { userId } = await auth()
  if (!userId) return { success: false, error: "Unauthorized" }

  const result = assetConversionSchema.safeParse(input)
  if (!result.success) {
    return { success: false, error: result.error.issues[0]?.message || "Invalid conversion data" }
  }

  const {
    fromAssetId,
    toAsset,
    date,
    fromQuantity,
    toQuantity,
    feeAmount = 0,
    feeCurrency,
    venue,
    originalPairPrice,
    note
  } = result.data

  const dateObj = new Date(date)

  try {
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Verify Source Asset
      const sourceAsset = await tx.asset.findUnique({
        where: { id: fromAssetId },
        include: { termDeposits: true }
      })

      if (!sourceAsset || sourceAsset.userId !== userId) {
        throw new Error("Source asset not found or access denied")
      }

      if (sourceAsset.assetClass === 'TERM_DEPOSIT') {
        throw new Error("Cannot convert from a Term Deposit asset. Resolve it via the maturity wizard.")
      }

      // 2. Resolve Target Asset
      let targetAssetId = toAsset?.id
      let targetSymbol = ""

      if (targetAssetId) {
        const asset = await tx.asset.findUnique({ where: { id: targetAssetId } })
        if (!asset || asset.userId !== userId) {
          throw new Error("Target asset not found or access denied")
        }
        if (asset.assetClass === 'TERM_DEPOSIT') {
          throw new Error("Cannot convert into a Term Deposit asset.")
        }
        targetSymbol = asset.symbol
      } else if (toAsset) {
        const normalizedSymbol = toAsset.symbol.toUpperCase().trim()
        if (toAsset.assetClass === 'TERM_DEPOSIT') {
          throw new Error("Cannot create a Term Deposit asset via conversion.")
        }

        // Find by symbol or create
        const existingAsset = await tx.asset.findFirst({
          where: { symbol: normalizedSymbol, userId }
        })

        if (existingAsset) {
          targetAssetId = existingAsset.id
          targetSymbol = existingAsset.symbol
        } else {
          const newAsset = await tx.asset.create({
            data: {
              symbol: normalizedSymbol,
              name: toAsset.name.trim(),
              assetClass: toAsset.assetClass,
              currency: toAsset.currency,
              userId
            }
          })
          targetAssetId = newAsset.id
          targetSymbol = newAsset.symbol
        }
      } else {
        throw new Error("Target asset information missing")
      }

      if (fromAssetId === targetAssetId) {
        throw new Error("Source and target assets must be different")
      }

      // 3. Calculate Cost Basis of Source
      const { availableQuantity, avgCostVnd } = await getAssetCostBasisAsOf(fromAssetId, userId, dateObj)

      // Dust tolerance check (1e-10)
      if (fromQuantity > availableQuantity + 1e-10) {
        throw new Error(`Insufficient quantity. Available: ${availableQuantity.toFixed(8)}, Requested: ${fromQuantity}`)
      }

      const transferValueVnd = fromQuantity * avgCostVnd
      const sellPricePerUnit = avgCostVnd
      
      // Fee handling: if fee is in target currency, subtract from quantity
      let netToQuantity = toQuantity
      if (feeCurrency === targetSymbol) {
        netToQuantity = toQuantity - feeAmount
      }

      if (netToQuantity <= 0) {
        throw new Error("Net received quantity must be positive after fees.")
      }
      
      const buyPricePerUnit = transferValueVnd / netToQuantity

      // 4. Create Linked Transactions
      const conversionId = crypto.randomUUID()

      const sellTx = await tx.transaction.create({
        data: {
          userId,
          assetId: fromAssetId,
          type: 'SELL',
          quantity: fromQuantity,
          pricePerUnit: sellPricePerUnit,
          grossAmount: transferValueVnd,
          date: dateObj,
          conversionId,
          metadata: {
            conversionRole: "FROM",
            fromSymbol: sourceAsset.symbol,
            toSymbol: targetSymbol,
            venue,
            originalPairPrice,
            feeAmount,
            feeCurrency,
            note
          }
        }
      })

      const buyTx = await tx.transaction.create({
        data: {
          userId,
          assetId: targetAssetId,
          type: 'BUY',
          quantity: netToQuantity,
          pricePerUnit: buyPricePerUnit,
          grossAmount: -transferValueVnd,
          date: dateObj,
          conversionId,
          metadata: {
            conversionRole: "TO",
            fromSymbol: sourceAsset.symbol,
            toSymbol: targetSymbol,
            rawToQuantity: toQuantity,
            netToQuantity,
            venue,
            originalPairPrice,
            feeAmount,
            feeCurrency,
            note
          }
        }
      })

      return {
        conversionId,
        fromTransactionId: sellTx.id,
        toTransactionId: buyTx.id,
        fromAssetId,
        toAssetId: targetAssetId,
        transferValueVnd
      }
    })

    // 5. Post-process: Recalculate and Revalidate
    const recalculations = []
    if (result.fromAssetId) recalculations.push(recalculateAssetPnL(result.fromAssetId, userId))
    if (result.toAssetId) recalculations.push(recalculateAssetPnL(result.toAssetId, userId))
    
    await Promise.all(recalculations)
    await recalculateHistoricalSnapshots(dateObj, userId)

    revalidatePath('/')
    revalidatePath('/holdings')
    if (result.fromAssetId) revalidatePath(`/holdings/${result.fromAssetId}`)
    if (result.toAssetId) revalidatePath(`/holdings/${result.toAssetId}`)
    revalidatePath('/ledger')
    revalidatePath('/rebalance')

    return {
      success: true,
      conversionId: result.conversionId,
      fromTransactionId: result.fromTransactionId,
      toTransactionId: result.toTransactionId,
      transferValueVnd: result.transferValueVnd
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Database operation failed"
    console.error("Asset conversion failed:", message)
    return { success: false, error: message }
  }
}
