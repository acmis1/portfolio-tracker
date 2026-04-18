import { z } from "zod"
import { CashTransactionType } from "@prisma/client"

export const cashTransactionSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  date: z.string().min(1, "Date is required"),
  type: z.nativeEnum(CashTransactionType),
  description: z.string().optional(),
  referenceId: z.string().optional(),
})

export type CashTransactionFormValues = z.infer<typeof cashTransactionSchema>
