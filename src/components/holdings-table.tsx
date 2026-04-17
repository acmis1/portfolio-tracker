import { getHoldingsLedger } from "@/lib/portfolio";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { TrendingUp, TrendingDown, Info } from "lucide-react";

export async function HoldingsTable() {
  const holdings = await getHoldingsLedger();

  if (holdings.length === 0) {
    return (
      <div className="glass-premium rounded-2xl p-12 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-400">
          <Info className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold text-white">No active holdings</h3>
        <p className="text-slate-400">Add a transaction to begin tracking your portfolio ledger.</p>
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
            {holdings.map((holding) => (
              <tr key={holding.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-white group-hover:text-emerald-400 transition-colors">{holding.symbol}</span>
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
                  {formatCurrency(holding.avgCost)}
                </td>
                <td className="px-6 py-4 text-right font-medium text-slate-300">
                  {holding.livePrice !== null ? formatCurrency(holding.livePrice) : "N/A"}
                </td>
                <td className="px-6 py-4 text-right font-bold text-white">
                  {formatCurrency(holding.marketValue)}
                </td>
                <td className="px-6 py-4 text-right">
                  {holding.unrealizedPnL !== null ? (
                    <div className="flex flex-col items-end">
                      <div className={`flex items-center gap-1 font-bold ${holding.unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {holding.unrealizedPnL >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {formatCurrency(holding.unrealizedPnL)}
                      </div>
                      <span className={`text-[10px] font-black ${holding.unrealizedPnL >= 0 ? 'text-emerald-500/70' : 'text-red-500/70'}`}>
                        {formatPercentage(holding.unrealizedPnLPctg!)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-500 italic">No pricing data</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
