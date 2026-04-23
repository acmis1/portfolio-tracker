'use server'

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { TransactionFormValues, transactionSchema } from "@/lib/validations"
import { auth } from "@clerk/nextjs/server"
import { recalculateAssetPnL, recalculateHistoricalSnapshots } from "../portfolio/actions/recalculate"

export async function addTransaction(formData: TransactionFormValues) {
  const { userId } = await auth()
  if (!userId) return { success: false, error: "Unauthorized" }
  // Convert date string to Date object before validation if needed, 
  // or handle it in the schema. In our schema it's a string, so we convert it here for Prisma.
  const result = transactionSchema.safeParse(formData)
  
  if (!result.success) {
    console.error(result.error)
    return { success: false, error: "Invalid transaction data" }
  }

  const { symbol, name, assetClass, type, quantity, price: rawPrice, fees: rawFees, date, currency, maturityDate, interestRate } = result.data
  const dateObj = new Date(date)
  
  // Logic for non-ticker assets: derive symbol from name if not provided
  let effectiveSymbol = symbol || name.toUpperCase().replace(/\s+/g, '_').trim()

  // FORCE unique asset records for Term Deposits
  if (assetClass === 'TERM_DEPOSIT') {
    effectiveSymbol = `TD_${Date.now()}`
  }

  const { getLiveExchangeRate } = await import("@/lib/fx")
  const USD_VND_RATE = await getLiveExchangeRate()
  const isUSD = currency === 'USD'
  
  // Convert to VND if input is USD
  const price = isUSD ? rawPrice * USD_VND_RATE : rawPrice
  const fees = isUSD ? rawFees * USD_VND_RATE : rawFees

  // Calculate grossAmount for the ledger
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
        // Update existing asset to match current transaction's metadata
        // This handles cases where an asset class changes (e.g. STOCK -> CRYPTO)
        asset = await tx.asset.update({
          where: { id: asset.id },
          data: {
            assetClass,
            name,
          }
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

      // Special handling for Term Deposits - Create the child record
      if (assetClass === 'TERM_DEPOSIT' && maturityDate && interestRate !== undefined) {
        await tx.termDeposit.create({
          data: {
            assetId: asset.id,
            bankName: name, // Using asset name as bank name for simplicity
            principal: price, // For TD, price is the principal
            startDate: dateObj,
            maturityDate: new Date(maturityDate),
            interestRate: interestRate,
          }
        })
      }

      const locale = currency === 'VND' ? 'vi-VN' : 'en-US';
      const formattedPrice = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        maximumFractionDigits: currency === 'VND' ? 0 : 2,
      }).format(rawPrice);

      // 2. Create associated CashTransaction for accurate cash ledger
      const cashTx = await tx.cashTransaction.create({
        data: {
          amount: Math.abs(grossAmount),
          date: dateObj,
          type: type === 'BUY' ? 'BUY_ASSET' : 'SELL_ASSET',
          description: `${type} ${quantity} ${effectiveSymbol} @ ${formattedPrice}`,
          currency: 'VND',
          userId,
        }
      })

      // 3. Create Transaction linked to the cash entry
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
          // Realized P&L will be calculated by the engine in the next step
        }
      })

      return { transaction, assetId: asset.id }
    })

    // 4. Trigger Recalculation Engine
    await recalculateAssetPnL(result.assetId, userId)
    await recalculateHistoricalSnapshots(dateObj, userId)

    revalidatePath('/')
    return { success: true }
  } catch (error: any) {
    console.error("Failed to add transaction:", error)
    return { success: false, error: "Database operation failed" }
  }
}

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
      // 1. Delete linked cash transaction first
      if (transaction.cashTransactionId) {
        await tx.cashTransaction.delete({
          where: { id: transaction.cashTransactionId }
        })
      }

      // 2. Delete the ledger entry
      await tx.transaction.delete({
        where: { id }
      })
    })

    // 3. Recalculate historical chain
    await recalculateAssetPnL(assetId, userId)
    await recalculateHistoricalSnapshots(date, userId)

    revalidatePath('/')
    return { success: true }
  } catch (error: any) {
    console.error("Failed to delete transaction:", error)
    return { success: false, error: "Deletion failed" }
  }
}

export async function editTransaction(id: string, formData: TransactionFormValues) {
  const { userId } = await auth()
  if (!userId) return { success: false, error: "Unauthorized" }

  const result = transactionSchema.safeParse(formData)
  if (!result.success) return { success: false, error: "Invalid data" }

  const { symbol, type, quantity, price: rawPrice, fees: rawFees, date, currency } = result.data
  const dateObj = new Date(date)

  const { getLiveExchangeRate } = await import("@/lib/fx")
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
      include: { cashTransaction: true }
    })

    if (!existing) return { success: false, error: "Transaction not found" }

    // Find the earliest date impacted to start recalculation
    const earliestDate = existing.date < dateObj ? existing.date : dateObj

    await prisma.$transaction(async (tx) => {
      // 1. Update cash transaction if it exists
      if (existing.cashTransactionId) {
        const locale = currency === 'VND' ? 'vi-VN' : 'en-US';
        const formattedPrice = new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: currency,
          maximumFractionDigits: currency === 'VND' ? 0 : 2,
        }).format(rawPrice);

        await tx.cashTransaction.update({
          where: { id: existing.cashTransactionId },
          data: {
            amount: Math.abs(grossAmount),
            date: dateObj,
            type: type === 'BUY' ? 'BUY_ASSET' : 'SELL_ASSET',
            description: `${type} ${quantity} ${symbol} @ ${formattedPrice}`,
          }
        })
      }

      // 2. Update the asset transaction
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

    // 3. Chain recalculation
    await recalculateAssetPnL(existing.assetId, userId)
    await recalculateHistoricalSnapshots(earliestDate, userId)

    revalidatePath('/')
    return { success: true }
  } catch (error: any) {
    console.error("Failed to edit transaction:", error)
    return { success: false, error: "Update failed" }
  }
}

export async function getUserAssets() {
  const { userId } = await auth()
  if (!userId) return []

  return prisma.asset.findMany({
    where: { userId },
    select: {
      symbol: true,
      name: true,
      assetClass: true,
    }
  })
}
