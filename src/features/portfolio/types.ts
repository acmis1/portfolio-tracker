export interface BaseHolding {
  id: string;
  symbol: string;
  name: string;
  currency: string;
  assetClass: string;
  marketValue: number;
  weight: number;
  status: string;
  quantity: number;
  avgCost: number;
  unrealizedPnL: number | null;
  unrealizedPnLPctg: number | null;
}

export interface LiquidHolding extends BaseHolding {
  type: 'LIQUID';
  livePrice: number | null;
}

export interface TermDepositHolding extends BaseHolding {
  type: 'TERM_DEPOSIT';
  principal: number;
  interestRate: number;
  startDate: Date;
  maturityDate: Date;
  accruedInterest: number;
  daysToMaturity: number;
}

export interface RealEstateHolding extends BaseHolding {
  type: 'REAL_ESTATE';
  purchasePrice: number;
  currentValuation: number;
  valuationDate: Date | null;
  appraisalAgeDays: number | null;
}

export interface GoldHolding extends BaseHolding {
  type: 'GOLD';
  livePrice: number | null;
  unit: string;
}

export interface CashHolding extends Omit<BaseHolding, 'avgCost' | 'unrealizedPnL' | 'unrealizedPnLPctg'> {
  type: 'CASH';
  balance: number;
}

export type InvestmentHolding = 
  | LiquidHolding 
  | TermDepositHolding 
  | RealEstateHolding 
  | GoldHolding;

export type AssetHolding = InvestmentHolding | CashHolding;
