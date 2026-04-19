import { z } from "zod"

export const transactionSchema = z.object({
  symbol: z.string().toUpperCase().optional(),
  name: z.string().min(1, "Name is required"),
  assetClass: z.enum(['CRYPTO', 'MUTUAL_FUND', 'STOCK', 'GOLD', 'TERM_DEPOSIT', 'REAL_ESTATE']),
  type: z.enum(['BUY', 'SELL', 'DIVIDEND', 'INTEREST']),
  quantity: z.number().positive("Quantity must be positive"),
  price: z.number().positive("Price must be positive"),
  fees: z.number().min(0, "Fees cannot be negative"),
  currency: z.enum(['VND', 'USD']),
  date: z.string().min(1, "Date is required"),
}).superRefine((data, ctx) => {
  const TICKER_CLASSES = ['STOCK', 'CRYPTO', 'MUTUAL_FUND'];
  if (TICKER_CLASSES.includes(data.assetClass) && !data.symbol) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Symbol is required for ticker assets",
      path: ["symbol"],
    });
  }
});

export type TransactionFormValues = z.infer<typeof transactionSchema>
