import { Transaction, Asset, CashTransaction, TermDeposit } from "@prisma/client";
import { TransactionFormValues } from "@/lib/validations";

export type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

export type TransactionFormMode = "create" | "edit";

export interface TransactionMetadata {
  conversionId?: string;
  conversionRole?: 'FROM' | 'TO';
  venue?: string;
  note?: string;
}

export type TransactionWithAsset = Transaction & {
  asset: Asset & {
    termDeposits: TermDeposit[];
  };
  cashTransaction?: CashTransaction | null;
};

export type AssetClass = TransactionFormValues["assetClass"];
export type AssetCurrency = TransactionFormValues["currency"];
export type TransactionType = TransactionFormValues["type"];
