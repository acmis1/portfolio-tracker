export interface PerformanceBucket {
  name: string;
  marketValue: number;
  netInvested: number;
  roi: number;
}

export function calculateAssetClassPerformance(assets: any[]): PerformanceBucket[] {
  const buckets: Record<string, { marketValue: number, netInvested: number }> = {
    Equities: { marketValue: 0, netInvested: 0 },
    'Fixed Income': { marketValue: 0, netInvested: 0 },
    Gold: { marketValue: 0, netInvested: 0 },
    Crypto: { marketValue: 0, netInvested: 0 },
    'Real Estate': { marketValue: 0, netInvested: 0 },
  };

  for (const asset of assets) {
    let bucketKey: string | null = null;
    
    if (['INDIVIDUAL_STOCK', 'ETF', 'STOCK_FUND'].includes(asset.assetClass)) bucketKey = 'Equities';
    else if (asset.assetClass === 'GOLD') bucketKey = 'Gold';
    else if (asset.assetClass === 'CRYPTO') bucketKey = 'Crypto';
    else if (asset.assetClass === 'BOND_FUND') bucketKey = 'Fixed Income';
    else if (asset.assetClass === 'REAL_ESTATE') bucketKey = 'Real Estate';

    if (!bucketKey) continue;

    let currentQty = 0;
    let avgCost = 0;
    let netInvestedForAsset = 0;

    for (const tx of asset.transactions) {
      const amount = Number(tx.grossAmount);
      
      if (tx.type === 'BUY') {
        const newQty = currentQty + tx.quantity;
        if (newQty > 0) {
          avgCost = (currentQty * avgCost + tx.quantity * tx.pricePerUnit) / newQty;
        }
        currentQty = newQty;
        netInvestedForAsset -= amount; 
      } else if (tx.type === 'SELL') {
        netInvestedForAsset -= amount;
        currentQty = Math.max(0, currentQty - tx.quantity);
        if (currentQty <= 0.000001) {
          avgCost = 0;
        }
      }
    }

    const livePrice = asset.prices[0]?.closePrice || 0;
    const effectivePrice = livePrice > 0 ? livePrice : avgCost;
    
    buckets[bucketKey].marketValue += currentQty * effectivePrice;
    buckets[bucketKey].netInvested += netInvestedForAsset;
  }

  return Object.entries(buckets).map(([name, data]) => {
    const hasInvested = Math.abs(data.netInvested) > 0.01;
    let roi = 0;
    if (hasInvested) {
      roi = ((data.marketValue - data.netInvested) / data.netInvested) * 100;
    }
    
    return {
      name,
      marketValue: data.marketValue,
      netInvested: data.netInvested,
      roi
    };
  });
}
