'use server'

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { cashTransactionSchema, type CashTransactionFormValues } from "./validations"
import { auth } from "@clerk/nextjs/server"
import { recalculateHistoricalSnapshots } from "../portfolio/actions/recalculate"

export async function getCashTransactions() {
  const { userId } = await auth()
  if (!userId) return []

  try {
    return await prisma.cashTransaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' }
    })
  } catch (error: any) {
    console.error("Failed to fetch cash transactions:", error)
    return []
  }
}

export async function getCashBalance() {
  const { userId } = await auth()
  if (!userId) return 0
  return await getCashBalanceInternal(userId)
}

/**
 * Internal version of getCashBalance that skips Clerk auth, 
 * but still requires providing the specific userId.
 */
export async function getCashBalanceInternal(userId: string) {
  try {
    const transactions = await prisma.cashTransaction.findMany({
      where: { userId }
    })
    
    // Accounting rules:
    // Inflows: DEPOSIT, DIVIDEND, INTEREST, SELL_ASSET -> add
    // Outflows: WITHDRAWAL, BUY_ASSET -> subtract
    return transactions.reduce((acc: number, tx: any) => {
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
  } catch (error: any) {
    console.error("Failed to calculate cash balance:", error)
    return 0
  }
}

export async function addCashTransaction(formData: CashTransactionFormValues) {
  const { userId } = await auth()
  if (!userId) return { success: false, error: "Unauthorized" }
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
        userId,
      }
    })

    // Trigger recalculation from this date
    await recalculateHistoricalSnapshots(dateObj, userId)

    revalidatePath('/')
    return { success: true }
  } catch (error: any) {
    console.error("Failed to add cash transaction:", error)
    return { success: false, error: "Database operation failed" }
  }
}

export async function deleteCashTransaction(id: string) {
  const { userId } = await auth()
  if (!userId) return { success: false, error: "Unauthorized" }

  try {
    const transaction = await prisma.cashTransaction.findFirst({
      where: { id, userId }
    })

    if (!transaction) return { success: false, error: "Cash transaction not found" }

    await prisma.cashTransaction.delete({
      where: { id }
    })

    // Recalculate from the date of the deleted transaction
    await recalculateHistoricalSnapshots(transaction.date, userId)

    revalidatePath('/')
    return { success: true }
  } catch (error: any) {
    console.error("Failed to delete cash transaction:", error)
    return { success: false, error: "Deletion failed" }
  }
}

export async function updateCashTransaction(id: string, formData: CashTransactionFormValues) {
  const { userId } = await auth()
  if (!userId) return { success: false, error: "Unauthorized" }

  const result = cashTransactionSchema.safeParse(formData)
  if (!result.success) return { success: false, error: "Invalid data" }

  const { amount, date, type, description } = result.data
  const dateObj = new Date(date)

  try {
    const existing = await prisma.cashTransaction.findFirst({
      where: { id, userId }
    })

    if (!existing) return { success: false, error: "Cash transaction not found" }

    const earliestDate = existing.date < dateObj ? existing.date : dateObj

    await prisma.cashTransaction.update({
      where: { id },
      data: {
        amount,
        date: dateObj,
        type,
        description,
      }
    })

    // Recalculate historical snapshots
    await recalculateHistoricalSnapshots(earliestDate, userId)

    revalidatePath('/')
    return { success: true }
  } catch (error: any) {
    console.error("Failed to update cash transaction:", error)
    return { success: false, error: "Update failed" }
  }
}
