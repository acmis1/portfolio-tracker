import { z } from "zod"

const CashTransactionTypes = [
  "DEPOSIT",
  "WITHDRAWAL",
  "DIVIDEND",
  "INTEREST",
  "BUY_ASSET",
  "SELL_ASSET",
] as const

export const cashTransactionSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  date: z.string().min(1, "Date is required"),
  type: z.enum(CashTransactionTypes),
  description: z.string().optional(),
  referenceId: z.string().optional(),
})

export type CashTransactionFormValues = z.infer<typeof cashTransactionSchema>
