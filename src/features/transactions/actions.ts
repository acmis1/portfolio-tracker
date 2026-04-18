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

  const { symbol, name, assetClass, type, quantity, price, fees, date } = result.data
  const dateObj = new Date(date)

  // Calculate grossAmount for the ledger
  // BUY: cash flow OUT (negative)
  // SELL: cash flow IN (positive)
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
          }
        })
      }

      // 2. Create Transaction
      await tx.transaction.create({
        data: {
          assetId: asset.id,
          type,
          quantity,
          pricePerUnit: price,
          grossAmount,
          date: dateObj,
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
