export interface HistoryPoint {
  date: string;
  value: number;
}

export function calculatePortfolioHistory(
  assets: any[],
  daysToFetch: number
): HistoryPoint[] {
  const history: HistoryPoint[] = [];
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  for (let i = daysToFetch - 1; i >= 0; i--) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() - i);
    currentDate.setHours(23, 59, 59, 999);

    let dailyTotalValue = 0;

    for (const asset of assets) {
      const quantityAtDate = asset.transactions
        .filter((tx: any) => tx.date <= currentDate)
        .reduce((acc: any, tx: any) => {
          if (tx.type === 'BUY') return acc + tx.quantity;
          if (tx.type === 'SELL') return acc - tx.quantity;
          return acc;
        }, 0);

      if (quantityAtDate > 0.000001) {
        let assetValue = 0;

        if (asset.assetClass === 'TERM_DEPOSIT') {
          const td = asset.termDeposits.find((t: any) => t.startDate <= currentDate);
          if (td) {
            const daysElapsed = Math.max(0, (currentDate.getTime() - td.startDate.getTime()) / (1000 * 60 * 60 * 24));
            const accruedInterest = (td.principal * (td.interestRate / 100) * daysElapsed) / 365;
            assetValue = td.principal + accruedInterest;
          }
        } else {
          const priceAtDate = asset.prices
            .filter((p: any) => p.date <= currentDate)
            .sort((a: any, b: any) => b.date.getTime() - a.date.getTime())[0]?.closePrice;

          if (priceAtDate !== undefined && priceAtDate !== null) {
            assetValue = quantityAtDate * priceAtDate;
          } else {
            let avgCostAtDate = 0;
            let runningQtyAtDate = 0;
            for (const tx of asset.transactions) {
              if (tx.date <= currentDate) {
                if (tx.type === 'BUY') {
                  const newQty = runningQtyAtDate + tx.quantity;
                  avgCostAtDate = (runningQtyAtDate * avgCostAtDate + tx.quantity * tx.pricePerUnit) / newQty;
                  runningQtyAtDate = newQty;
                } else if (tx.type === 'SELL') {
                  runningQtyAtDate = Math.max(0, runningQtyAtDate - tx.quantity);
                  if (runningQtyAtDate === 0) avgCostAtDate = 0;
                }
              }
            }
            assetValue = quantityAtDate * avgCostAtDate;
          }
        }

        dailyTotalValue += assetValue;
      }
    }

    history.push({
      date: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: dailyTotalValue
    });
  }

  return history;
}
