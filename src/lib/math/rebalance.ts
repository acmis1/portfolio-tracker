/**
 * Rebalancing Engine Logic
 * 
 * This utility calculates the required adjustments to align a portfolio's actual 
 * weights with its target weights. It strictly uses raw number types and enforces
 * asset-class specific fractional rules.
 */

export interface ManagedPosition {
  symbol: string;
  assetClass: string;
  quantity: number;
  currentPrice: number;
  targetWeight: number; // 0.0 to 1.0
}

export interface RebalanceNode {
  symbol: string;
  currentValue: number;
  targetValue: number;
  deltaCash: number;
  deltaShares: number;
  action: 'BUY' | 'SELL' | 'HOLD';
}

export interface RebalancePlan {
  totalAum: number;
  nodes: RebalanceNode[];
}

export function calculateRebalancePlan(
  positions: ManagedPosition[],
  cashBalance: number
): RebalancePlan {
  // 1. Calculate Total AUM
  const totalCurrentAssetValue = positions.reduce(
    (sum, pos) => sum + pos.quantity * pos.currentPrice, 
    0
  );
  const totalAum = cashBalance + totalCurrentAssetValue;

  // 2. Calculate rebalance nodes
  const nodes: RebalanceNode[] = positions.map(pos => {
    const currentValue = pos.quantity * pos.currentPrice;
    const targetValue = totalAum * pos.targetWeight;
    const deltaCash = targetValue - currentValue;
    
    let deltaShares = deltaCash / pos.currentPrice;
    
    // Apply fractional rules
    if (pos.assetClass === 'CRYPTO') {
      // Allow deep fractionals (up to 8 decimal places)
      deltaShares = Number(deltaShares.toFixed(8));
    } else {
      // Enforce strict integer lot sizes for other asset classes
      deltaShares = Math.floor(deltaShares);
    }

    // Determine action with Immaterial Filter
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    if (Math.abs(deltaCash) >= 1.0) {
      action = deltaCash > 0 ? 'BUY' : 'SELL';
    }

    return {
      symbol: pos.symbol,
      currentValue,
      targetValue,
      deltaCash,
      deltaShares,
      action
    };
  });

  return {
    totalAum,
    nodes
  };
}
