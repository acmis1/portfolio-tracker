import { formatActivityType, formatVND } from "@/lib/utils/format";
import { ActivityType } from "../queries";

export type TransactionDisplayType = ActivityType | string;

export type ActivityCategory = "TRADE" | "CASH" | "INCOME" | "INTERNAL" | "OTHER";

/**
 * Returns a human-readable label for a transaction type.
 */
export function getActivityTypeLabel(type: TransactionDisplayType): string {
  return formatActivityType(type);
}

/**
 * Categorizes a transaction type for filtering or grouping.
 */
export function getActivityCategory(type: TransactionDisplayType): ActivityCategory {
  switch (type) {
    case "BUY":
    case "SELL":
      return "TRADE";
    case "DEPOSIT":
    case "WITHDRAWAL":
      return "CASH";
    case "DIVIDEND":
    case "INTEREST":
      return "INCOME";
    case "CONVERSION":
      return "INTERNAL";
    default:
      return "OTHER";
  }
}

/**
 * Determines if a transaction type is considered a cash inflow.
 */
export function isInflowActivity(type: TransactionDisplayType): boolean {
  const inflowTypes: TransactionDisplayType[] = ["SELL", "DEPOSIT", "DIVIDEND", "INTEREST"];
  return inflowTypes.includes(type);
}

/**
 * Returns the visual tone associated with a transaction type.
 */
export function getActivityTone(type: TransactionDisplayType): "positive" | "negative" | "neutral" | "info" {
  if (type === "CONVERSION") return "info";
  
  const positiveTypes: TransactionDisplayType[] = ["SELL", "DEPOSIT", "DIVIDEND", "INTEREST"];
  const negativeTypes: TransactionDisplayType[] = ["BUY", "WITHDRAWAL"];
  
  if (positiveTypes.includes(type)) return "positive";
  if (negativeTypes.includes(type)) return "negative";
  
  return "neutral";
}

/**
 * Formats a signed amount display with appropriate prefix and tone.
 */
export function getSignedAmountDisplay(params: {
  type: TransactionDisplayType;
  amount: number;
  category?: string;
}): {
  text: string;
  tone: "positive" | "negative" | "neutral";
} {
  const isPositive = isInflowActivity(params.type);
  const tone = params.type === "CONVERSION" ? "neutral" : (isPositive ? "positive" : "negative");
  const prefix = params.type === "CONVERSION" ? "" : (isPositive ? "+" : "-");
  
  return {
    text: `${prefix} ${formatVND(Math.abs(params.amount))}`,
    tone
  };
}

/**
 * Formats a conversion display label.
 */
export function getConversionLabel(params: {
  fromSymbol?: string | null;
  toSymbol?: string | null;
}): string {
  if (!params.fromSymbol || !params.toSymbol) {
    return "Internal Conversion";
  }
  return `Converted ${params.fromSymbol} → ${params.toSymbol}`;
}
