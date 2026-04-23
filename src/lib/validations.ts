import { z } from "zod"

export const ASSET_CLASSES = [
  'INDIVIDUAL_STOCK',
  'ETF',
  'STOCK_FUND',
  'BOND_FUND',
  'CRYPTO',
  'REAL_ESTATE',
  'TERM_DEPOSIT',
  'GOLD',
] as const;

export const transactionSchema = z.object({
  symbol: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  assetClass: z.enum(ASSET_CLASSES),
  type: z.enum(['BUY', 'SELL', 'DIVIDEND', 'INTEREST']),
  quantity: z.number().positive("Quantity must be positive"),
  price: z.number().positive("Price must be positive"),
  fees: z.number().min(0, "Fees cannot be negative"),
  currency: z.enum(['VND', 'USD']),
  date: z.string().min(1, "Date is required"),
  maturityDate: z.string().optional(),
  interestRate: z.number().optional(),
}).superRefine((data, ctx) => {
  const TICKER_CLASSES = ['INDIVIDUAL_STOCK', 'ETF', 'STOCK_FUND', 'BOND_FUND', 'CRYPTO'];
  
  // Requirement for Ticker Assets
  if (TICKER_CLASSES.includes(data.assetClass) && !data.symbol) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Symbol is required for ticker assets",
      path: ["symbol"],
    });
  }

  // Requirement for Term Deposits
  if (data.assetClass === 'TERM_DEPOSIT') {
    if (!data.maturityDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Maturity date is required for term deposits",
        path: ["maturityDate"],
      });
    }
    if (data.interestRate === undefined || data.interestRate === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Interest rate is required for term deposits",
        path: ["interestRate"],
      });
    }
  }
});

export type TransactionFormValues = z.infer<typeof transactionSchema>
