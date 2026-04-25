'use server'

import { prisma } from "@/server/db"
import { revalidatePath } from "next/cache"
import { TransactionFormValues, transactionSchema } from "@/lib/validations"
import { auth } from "@clerk/nextjs/server"
import { recalculateAssetPnL, recalculateHistoricalSnapshots } from "../../portfolio/actions/recalculate"
import { getTransactionDisplayLabel } from "../services/display-labels"
import { getLiveExchangeRate } from "@/lib/fx"

export async function addTransaction(formData: TransactionFormValues) {
  const { userId } = await auth()
  if (!userId) return { success: false, error: "Unauthorized" }

  const result = transactionSchema.safeParse(formData)
  if (!result.success) {
    return { success: false, error: "Invalid transaction data" }
  }

  const { 
    symbol, name, assetClass, type, quantity, 
    price: rawPrice, fees: rawFees, date, currency, 
    maturityDate, interestRate 
  } = result.data
  
  const dateObj = new Date(date)
  let effectiveSymbol = symbol || name.toUpperCase().replace(/\s+/g, '_').trim()

  if (assetClass === 'TERM_DEPOSIT') {
    effectiveSymbol = `TD_${Date.now()}`
  }

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
    const result = await prisma.$transaction(async (tx: any) => {
      let asset = await tx.asset.findFirst({
        where: { symbol: effectiveSymbol, userId }
      })

      if (asset) {
        asset = await tx.asset.update({
          where: { id: asset.id },
          data: { assetClass, name }
        })
      } else {
        asset = await tx.asset.create({
          data: {
            symbol: effectiveSymbol,
            name,
            assetClass,
            currency,
            userId,
          }
        })
      }

      if (assetClass === 'TERM_DEPOSIT' && maturityDate && interestRate !== undefined) {
        await tx.termDeposit.create({
          data: {
            assetId: asset.id,
            bankName: name,
            principal: price,
            startDate: dateObj,
            maturityDate: new Date(maturityDate),
            interestRate: interestRate,
          }
        })
      }

      const locale = currency === 'VND' ? 'vi-VN' : 'en-US'
      const formattedPrice = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        maximumFractionDigits: currency === 'VND' ? 0 : 2,
      }).format(rawPrice)

      const displayLabel = getTransactionDisplayLabel(symbol, name, assetClass, dateObj, maturityDate)

      const cashTx = await tx.cashTransaction.create({
        data: {
          amount: Math.abs(grossAmount),
          date: dateObj,
          type: type === 'BUY' ? 'BUY_ASSET' : 'SELL_ASSET',
          description: `${type} ${quantity} ${displayLabel} @ ${formattedPrice}`,
          currency: 'VND',
          userId,
        }
      })

      const transaction = await tx.transaction.create({
        data: {
          assetId: asset.id,
          type,
          quantity,
          pricePerUnit: price,
          grossAmount,
          date: dateObj,
          cashTransactionId: cashTx.id,
          userId,
        }
      })

      return { transaction, assetId: asset.id }
    })

    await recalculateAssetPnL(result.assetId, userId)
    await recalculateHistoricalSnapshots(dateObj, userId)

    revalidatePath('/')
    return { success: true }
  } catch (error: any) {
    console.error("Failed to add transaction:", error)
    return { success: false, error: "Database operation failed" }
  }
}
