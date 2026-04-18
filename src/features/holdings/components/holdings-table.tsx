import { getHoldingsLedger } from "@/features/portfolio/utils";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { TrendingUp, TrendingDown, Info, Plus } from "lucide-react";
import { TransactionModal } from "@/features/transactions/components/transaction-modal";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export async function HoldingsTable() {
  const holdings = await getHoldingsLedger();

  if (holdings.length === 0) {
    return (
      <div className="glass-premium rounded-2xl p-12 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-400">
          <Info className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold text-white">No active holdings</h3>
        <p className="mb-6 text-slate-400">Add a transaction to begin tracking your portfolio ledger.</p>
        <TransactionModal 
          trigger={
            <Button variant="premium">
              <Plus className="mr-2 h-4 w-4" /> Add your first transaction
            </Button>
          } 
        />
      </div>
    );
  }

  return (
    <div className="glass-premium overflow-hidden rounded-2xl border border-white/5 shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/5 bg-white/5">
              <th className="px-6 py-4 font-black uppercase tracking-wider text-slate-400">Asset</th>
              <th className="px-6 py-4 font-black uppercase tracking-wider text-slate-400">Class</th>
              <th className="px-6 py-4 text-right font-black uppercase tracking-wider text-slate-400">Quantity</th>
              <th className="px-6 py-4 text-right font-black uppercase tracking-wider text-slate-400">Avg Cost</th>
              <th className="px-6 py-4 text-right font-black uppercase tracking-wider text-slate-400">Live Price</th>
              <th className="px-6 py-4 text-right font-black uppercase tracking-wider text-slate-400">Market Value</th>
              <th className="px-6 py-4 text-right font-black uppercase tracking-wider text-slate-400">Unrealized P&L</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {holdings.map((holding) => {
              const isUSD = holding.currency === 'USD';
              const rate = 25400; // Hardcoded fallback or import
              
              const displayAvgCost = isUSD ? holding.avgCost / rate : holding.avgCost;
              const displayLivePrice = isUSD && holding.livePrice !== null ? holding.livePrice / rate : holding.livePrice;
              const displayMarketValue = isUSD ? holding.marketValue / rate : holding.marketValue;
              const displayPnL = isUSD && holding.unrealizedPnL !== null ? holding.unrealizedPnL / rate : holding.unrealizedPnL;

              return (
                <tr key={holding.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <Link href={`/holdings/${holding.id}`} className="font-bold text-white hover:text-emerald-400 transition-colors">
                        {holding.symbol}
                      </Link>
                      <span className="text-xs text-slate-500">{holding.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      {holding.assetClass.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-slate-300">
                    {holding.quantity.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-slate-300">
                    {formatCurrency(displayAvgCost, holding.currency)}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-slate-300">
                    {displayLivePrice !== null ? formatCurrency(displayLivePrice, holding.currency) : "N/A"}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-white">
                    {formatCurrency(displayMarketValue, holding.currency)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {displayPnL !== null ? (
                      <div className="flex flex-col items-end">
                        <div className={`flex items-center gap-1 font-bold ${displayPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {displayPnL >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {formatCurrency(displayPnL, holding.currency)}
                        </div>
                        <span className={`text-[10px] font-black ${displayPnL >= 0 ? 'text-emerald-500/70' : 'text-red-500/70'}`}>
                          {formatPercentage(holding.unrealizedPnLPctg!)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-500 italic">No pricing data</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
