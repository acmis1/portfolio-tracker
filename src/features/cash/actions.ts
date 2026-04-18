'use server'

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { cashTransactionSchema, type CashTransactionFormValues } from "./validations"

export async function getCashTransactions() {
  try {
    return await prisma.cashTransaction.findMany({
      orderBy: { date: 'desc' }
    })
  } catch (error) {
    console.error("Failed to fetch cash transactions:", error)
    return []
  }
}

export async function getCashBalance() {
  try {
    const transactions = await prisma.cashTransaction.findMany()
    
    // Accounting rules:
    // Inflows: DEPOSIT, DIVIDEND, INTEREST, SELL_ASSET -> add
    // Outflows: WITHDRAWAL, BUY_ASSET -> subtract
    return transactions.reduce((acc, tx) => {
      switch (tx.type) {
        case 'DEPOSIT':
        case 'DIVIDEND':
        case 'INTEREST':
        case 'SELL_ASSET':
          return acc + tx.amount
        case 'WITHDRAWAL':
        case 'BUY_ASSET':
          return acc - tx.amount
        default:
          return acc
      }
    }, 0)
  } catch (error) {
    console.error("Failed to calculate cash balance:", error)
    return 0
  }
}

export async function addCashTransaction(formData: CashTransactionFormValues) {
  const result = cashTransactionSchema.safeParse(formData)
  
  if (!result.success) {
    console.error(result.error)
    return { success: false, error: "Invalid cash transaction data" }
  }

  const { amount, date, type, description, referenceId } = result.data
  const dateObj = new Date(date)

  try {
    await prisma.cashTransaction.create({
      data: {
        amount,
        date: dateObj,
        type,
        description,
        referenceId,
        currency: "VND", // Default currency for now
      }
    })

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error("Failed to add cash transaction:", error)
    return { success: false, error: "Database operation failed" }
  }
}
