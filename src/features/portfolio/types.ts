export interface BaseHolding {
  id: string;
  symbol: string;
  name: string;
  currency: string;
  assetClass: string;
  marketValue: number;
  weight: number;
  status: string;
}

export interface LiquidHolding extends BaseHolding {
  type: 'LIQUID';
  quantity: number;
  avgCost: number;
  livePrice: number | null;
  unrealizedPnL: number | null;
  unrealizedPnLPctg: number | null;
}

export interface TermDepositHolding extends BaseHolding {
  type: 'TERM_DEPOSIT';
  principal: number;
  interestRate: number;
  startDate: Date;
  maturityDate: Date;
  accruedInterest: number;
  daysToMaturity: number;
  unrealizedPnL: number;
  unrealizedPnLPctg: number;
}

export interface RealEstateHolding extends BaseHolding {
  type: 'REAL_ESTATE';
  purchasePrice: number;
  currentValuation: number;
  valuationDate: Date | null;
  appraisalAgeDays: number | null;
  unrealizedPnL: number;
  unrealizedPnLPctg: number;
}

export interface GoldHolding extends BaseHolding {
  type: 'GOLD';
  quantity: number;
  avgCost: number;
  livePrice: number | null;
  unrealizedPnL: number | null;
  unrealizedPnLPctg: number | null;
  unit: string;
}

export interface CashHolding extends BaseHolding {
  type: 'CASH';
  balance: number;
  quantity: number;
}

export type AssetHolding = 
  | LiquidHolding 
  | TermDepositHolding 
  | RealEstateHolding 
  | GoldHolding 
  | CashHolding;
