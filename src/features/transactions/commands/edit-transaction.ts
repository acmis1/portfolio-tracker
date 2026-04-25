'use server'

import { prisma } from "@/server/db"
import { revalidatePath } from "next/cache"
import { TransactionFormValues, transactionSchema } from "@/lib/validations"
import { auth } from "@clerk/nextjs/server"
import { recalculateAssetPnL, recalculateHistoricalSnapshots } from "../../portfolio/actions/recalculate"
import { getTransactionDisplayLabel } from "../services/display-labels"
import { getLiveExchangeRate } from "@/lib/fx"

export async function editTransaction(id: string, formData: TransactionFormValues) {
  const { userId } = await auth()
  if (!userId) return { success: false, error: "Unauthorized" }

  const result = transactionSchema.safeParse(formData)
  if (!result.success) return { success: false, error: "Invalid data" }

  const { 
    symbol, name, assetClass, type, quantity, 
    price: rawPrice, fees: rawFees, date, currency, 
    maturityDate 
  } = result.data
  
  const dateObj = new Date(date)
  const USD_VND_RATE = await getLiveExchangeRate()
  const isUSD = currency === 'USD'
  
  const price = isUSD ? rawPrice * USD_VND_RATE : rawPrice
  const fees = isUSD ? rawFees * USD_VND_RATE : rawFees

  let grossAmount = 0
  if (type === 'BUY') {
    grossAmount = -(quantity * price + fees)
  } else if (type === 'SELL') {
    grossAmount = (quantity * price - fees)
  } else {
    grossAmount = (quantity * price)
  }

  try {
    const existing = await prisma.transaction.findFirst({
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

    if (!existing) return { success: false, error: "Transaction not found" }

    // Task G: Block editing transactions for resolved Term Deposits
    const isResolvedTD = existing.asset.termDeposits.some(td => td.resolvedAt !== null)
    if (isResolvedTD) {
      return { 
        success: false, 
        error: "Resolved term deposit transactions cannot be edited yet. Use a dedicated reversal workflow." 
      }
    }

    const earliestDate = existing.date < dateObj ? existing.date : dateObj

    await prisma.$transaction(async (tx) => {
      await tx.asset.update({
        where: { id: existing.assetId },
        data: { name, assetClass }
      })

      if (existing.cashTransactionId) {
        const locale = currency === 'VND' ? 'vi-VN' : 'en-US'
        const formattedPrice = new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: currency,
          maximumFractionDigits: currency === 'VND' ? 0 : 2,
        }).format(rawPrice)

        const displayLabel = getTransactionDisplayLabel(symbol, name, assetClass, dateObj, maturityDate)

        await tx.cashTransaction.update({
          where: { id: existing.cashTransactionId },
          data: {
            amount: Math.abs(grossAmount),
            date: dateObj,
            type: type === 'BUY' ? 'BUY_ASSET' : 'SELL_ASSET',
            description: `${type} ${quantity} ${displayLabel} @ ${formattedPrice}`,
          }
        })
      }

      await tx.transaction.update({
        where: { id },
        data: {
          type,
          quantity,
          pricePerUnit: price,
          grossAmount,
          date: dateObj,
        }
      })
    })

    await recalculateAssetPnL(existing.assetId, userId)
    await recalculateHistoricalSnapshots(earliestDate, userId)

    revalidatePath('/')
    revalidatePath('/holdings')
    revalidatePath(`/holdings/${existing.assetId}`)
    revalidatePath('/ledger')
    revalidatePath('/rebalance')

    return { success: true }
  } catch (error) {
    console.error("Failed to edit transaction:", error)
    return { success: false, error: "Update failed" }
  }
}
