'use server'

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { TransactionFormValues, transactionSchema } from "@/lib/validations"

export async function addTransaction(formData: TransactionFormValues) {
  // Convert date string to Date object before validation if needed, 
  // or handle it in the schema. In our schema it's a string, so we convert it here for Prisma.
  const result = transactionSchema.safeParse(formData)
  
  if (!result.success) {
    console.error(result.error)
    return { success: false, error: "Invalid transaction data" }
  }

  const { symbol, name, assetClass, type, quantity, price: rawPrice, fees: rawFees, date, currency } = result.data
  const dateObj = new Date(date)

  const { USD_VND_RATE } = await import("@/lib/constants")
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
    await prisma.$transaction(async (tx) => {
      // 1. Ensure Asset exists (safe finding by symbol)
      let asset = await tx.asset.findFirst({
        where: { symbol }
      })

      if (!asset) {
        asset = await tx.asset.create({
          data: {
            symbol,
            name,
            assetClass,
            currency,
          }
        })
      }

      // 2. Calculate Realized P&L if this is a SELL transaction
      let realizedPnL = null
      if (type === 'SELL') {
        // Fetch historical transactions to compute cost basis
        const history = await tx.transaction.findMany({
          where: { assetId: asset.id },
          orderBy: { date: 'asc' }
        })

        let currentQty = 0
        let currentAvgCost = 0
        for (const t of history) {
          if (t.type === 'BUY') {
            const newQty = currentQty + t.quantity
            currentAvgCost = (currentQty * currentAvgCost + t.quantity * t.pricePerUnit) / newQty
            currentQty = newQty
          } else if (t.type === 'SELL') {
            currentQty = Math.max(0, currentQty - t.quantity)
            if (currentQty === 0) currentAvgCost = 0
          }
        }
        
        // realizedPnL = ((sellPrice - avgCost) * quantity) - fees
        realizedPnL = ((price - currentAvgCost) * quantity) - fees
      }

      // 3. Create Transaction
      await tx.transaction.create({
        data: {
          assetId: asset.id,
          type,
          quantity,
          pricePerUnit: price,
          grossAmount,
          date: dateObj,
          realizedPnL: realizedPnL ?? undefined,
        }
      })
    })

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error("Failed to add transaction:", error)
    return { success: false, error: "Database operation failed" }
  }
}
