export interface Holding {
  assetId: string;
  symbol: string;
  name: string;
  assetClass: string;
  quantity: number;
  currentPrice: number;
}

export interface Target {
  type: 'SYMBOL' | 'CLASS';
  symbol?: string;
  assetClass?: string;
  targetWeight: number; // 0.0 to 1.0
}

export interface RebalanceNode {
  key: string;
  symbol: string;
  name: string;
  currentValue: number;
  targetValue: number;
  deltaCash: number;
  deltaShares: number;
  action: 'BUY' | 'SELL' | 'HOLD';
  assetId?: string;
  currentPrice?: number;
}

export interface RebalancePlan {
  totalAum: number;
  nodes: RebalanceNode[];
}

export function calculateRebalancePlan(
  holdings: Holding[],
  targets: Target[],
  globalPortfolioAum: number
): RebalancePlan {
  const totalAum = globalPortfolioAum;

  const nodes: RebalanceNode[] = [];
  const assignedAssetIds = new Set<string>();

  // 1. Process Symbol Targets (Priority)
  const symbolTargets = targets.filter(t => t.type === 'SYMBOL');
  for (const target of symbolTargets) {
    const matchingHoldings = holdings.filter(h => h.symbol === target.symbol);
    const currentValue = matchingHoldings.reduce((sum, h) => sum + h.quantity * h.currentPrice, 0);
    const targetValue = totalAum * target.targetWeight;
    const deltaCash = targetValue - currentValue;

    let deltaShares = 0;
    let assetId: string | undefined;

    // If we have matching holdings, calculate shares based on the first one (standardizing)
    if (matchingHoldings.length > 0) {
      const primary = matchingHoldings[0];
      assetId = primary.assetId;
      deltaShares = deltaCash / primary.currentPrice;
      
      if (primary.assetClass === 'CRYPTO') {
        deltaShares = Number(deltaShares.toFixed(8));
      } else {
        deltaShares = Math.floor(deltaShares);
      }
    }

    nodes.push({
      key: `SYMBOL:${target.symbol}`,
      symbol: target.symbol!,
      name: matchingHoldings[0]?.name || target.symbol!,
      currentValue,
      targetValue,
      deltaCash,
      deltaShares,
      action: Math.abs(deltaCash) >= 1.0 ? (deltaCash > 0 ? 'BUY' : 'SELL') : 'HOLD',
      assetId,
      currentPrice: matchingHoldings[0]?.currentPrice
    });

    matchingHoldings.forEach(h => assignedAssetIds.add(h.assetId));
  }

  // 2. Process Class Targets
  const classTargets = targets.filter(t => t.type === 'CLASS');
  for (const target of classTargets) {
    const matchingHoldings = holdings.filter(
      h => h.assetClass === target.assetClass && !assignedAssetIds.has(h.assetId)
    );
    const currentValue = matchingHoldings.reduce((sum, h) => sum + h.quantity * h.currentPrice, 0);
    const targetValue = totalAum * target.targetWeight;
    const deltaCash = targetValue - currentValue;

    nodes.push({
      key: `CLASS:${target.assetClass}`,
      symbol: target.assetClass!,
      name: `${target.assetClass} Bucket`,
      currentValue,
      targetValue,
      deltaCash,
      deltaShares: 0, // Cannot calculate shares for a bucket aggregate
      action: Math.abs(deltaCash) >= 1.0 ? (deltaCash > 0 ? 'BUY' : 'SELL') : 'HOLD',
    });

    matchingHoldings.forEach(h => assignedAssetIds.add(h.assetId));
  }

  // 3. Process Unmanaged Holdings (Target Value 0)
  const unmanagedHoldings = holdings.filter(h => !assignedAssetIds.has(h.assetId));
  for (const h of unmanagedHoldings) {
    const currentValue = h.quantity * h.currentPrice;
    const targetValue = 0;
    const deltaCash = -currentValue;
    const deltaShares = -h.quantity;

    nodes.push({
      key: `UNMANAGED:${h.assetId}`,
      symbol: h.symbol,
      name: `${h.name} (Unmanaged)`,
      currentValue,
      targetValue,
      deltaCash,
      deltaShares,
      action: 'SELL',
      assetId: h.assetId,
      currentPrice: h.currentPrice
    });
  }

  return {
    totalAum,
    nodes
  };
}
