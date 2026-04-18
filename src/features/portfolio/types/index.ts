export interface AssetDrift {
  assetId: string;
  symbol: string;
  name: string;
  currentQuantity: number;
  currentPrice: number;
  marketValue: number;
  targetWeight: number;    // %
  currentWeight: number;   // %
  drift: number;           // % (currentWeight - targetWeight)
  targetValue: number;     // VND
  actionAmount: number;    // VND (targetValue - marketValue)
}

export interface RebalancingSummary {
  totalPortfolioValue: number;
  cashBalance: number;
  investedValue: number;
  drifts: AssetDrift[];
}
