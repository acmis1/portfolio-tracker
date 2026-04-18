import { z } from "zod"

export const transactionSchema = z.object({
  symbol: z.string().min(1, "Symbol is required").toUpperCase(),
  name: z.string().min(1, "Name is required"),
  assetClass: z.enum(['CRYPTO', 'MUTUAL_FUND', 'STOCK', 'GOLD', 'TERM_DEPOSIT', 'REAL_ESTATE']),
  type: z.enum(['BUY', 'SELL', 'DIVIDEND', 'INTEREST']),
  quantity: z.number().positive("Quantity must be positive"),
  price: z.number().positive("Price must be positive"),
  fees: z.number().min(0, "Fees cannot be negative"),
  date: z.string().min(1, "Date is required"), // Use string for easier form handling with <input type="date">
})

export type TransactionFormValues = z.infer<typeof transactionSchema>
