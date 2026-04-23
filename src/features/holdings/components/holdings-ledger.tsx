import { AssetHolding } from "@/features/portfolio/utils";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { formatVND, formatNumberDots } from "@/lib/utils/format";
import { TrendingUp, TrendingDown, Clock, MapPin, Building2, Wallet } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface HoldingsLedgerProps {
  holdings: AssetHolding[];
  fxRate: number;
}

export function HoldingsLedger({ holdings, fxRate }: HoldingsLedgerProps) {
  const liquidAssets = holdings.filter(h => h.type === 'LIQUID' || h.type === 'GOLD' || h.type === 'CASH');
  const termDeposits = holdings.filter(h => h.type === 'TERM_DEPOSIT');
  const realEstate = holdings.filter(h => h.type === 'REAL_ESTATE');

  return (
    <div className="space-y-12">
      {/* Portfolio Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-premium p-6 rounded-2xl border border-white/5">
          <div className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">Total Market Value</div>
          <div className="text-2xl font-black text-white">
            {formatVND(holdings.reduce((sum, h) => sum + h.marketValue, 0))}
          </div>
        </div>
        <div className="glass-premium p-6 rounded-2xl border border-white/5">
          <div className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">Liquid Breakdown</div>
          <div className="text-2xl font-black text-white">
             {formatVND(liquidAssets.reduce((sum, h) => sum + h.marketValue, 0))}
          </div>
        </div>
        <div className="glass-premium p-6 rounded-2xl border border-white/5">
          <div className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">Total Assets</div>
          <div className="text-2xl font-black text-white">{holdings.length} Positions</div>
        </div>
      </div>

      {/* 1. Liquid Assets Section */}
      {liquidAssets.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Liquid Holdings</h2>
          </div>
          <div className="glass-premium rounded-2xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5">
                    <th className="px-6 py-4 font-black uppercase tracking-wider text-slate-400">Asset</th>
                    <th className="px-6 py-4 text-right font-black uppercase tracking-wider text-slate-400">Qty / Units</th>
                    <th className="px-6 py-4 text-right font-black uppercase tracking-wider text-slate-400">Avg Cost</th>
                    <th className="px-6 py-4 text-right font-black uppercase tracking-wider text-slate-400">Price</th>
                    <th className="px-6 py-4 text-right font-black uppercase tracking-wider text-slate-400">Value (VND)</th>
                    <th className="px-6 py-4 text-right font-black uppercase tracking-wider text-slate-400">ROI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {liquidAssets.map((h) => {
                    const holding = h as any; // Liquid or Gold
                    const isUSD = holding.currency === 'USD';
                    const displayAvgCost = isUSD ? holding.avgCost / fxRate : holding.avgCost;
                    const displayLivePrice = isUSD && holding.livePrice !== null ? holding.livePrice / fxRate : holding.livePrice;

                    return (
                      <tr key={holding.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4">
                          {holding.type === 'CASH' ? (
                            <div className="flex flex-col">
                              <span className="font-bold text-white">{holding.symbol}</span>
                              <span className="text-xs text-slate-500">{holding.name}</span>
                            </div>
                          ) : (
                            <Link href={`/holdings/${holding.id}`} className="flex flex-col group/link">
                              <span className="font-bold text-white group-hover/link:text-emerald-400 transition-colors">{holding.symbol}</span>
                              <span className="text-xs text-slate-500">{holding.name}</span>
                            </Link>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-slate-300">
                          {holding.type === 'CASH' ? '—' : formatNumberDots(holding.quantity)}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-slate-300">
                          {holding.type === 'CASH' ? '—' : formatCurrency(displayAvgCost, holding.currency)}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-slate-300">
                          {holding.type === 'CASH' ? '—' : (displayLivePrice !== null ? formatCurrency(displayLivePrice, holding.currency) : "N/A")}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-white">
                          {formatVND(holding.marketValue)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {holding.type === 'CASH' ? (
                            <span className={cn(
                              "text-xs font-black uppercase tracking-widest",
                              holding.marketValue >= 0 ? "text-emerald-400" : "text-amber-400"
                            )}>
                              {holding.status}
                            </span>
                          ) : holding.unrealizedPnLPctg !== null ? (
                            <div className={cn(
                              "inline-flex items-center gap-1 font-black px-2 py-0.5 rounded-full text-[10px]",
                              holding.unrealizedPnLPctg >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                            )}>
                              {holding.unrealizedPnLPctg >= 0 ? '+' : ''}{holding.unrealizedPnLPctg.toFixed(2)}%
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500 italic lowercase tracking-widest">{holding.status}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* 2. Term Deposits Section */}
      {termDeposits.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-400" />
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Term Deposits</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {termDeposits.map((h) => {
              const holding = h as any; // TermDepositHolding
              return (
                <div key={holding.id} className="glass-premium p-6 rounded-2xl border border-white/5 space-y-4 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-4">
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                        holding.daysToMaturity <= 0 ? "bg-red-500/10 text-red-400" : "bg-blue-500/10 text-blue-400"
                      )}>
                        {holding.status}
                      </span>
                   </div>
                   
                   <div>
                    <Link href={`/holdings/${holding.id}`} className="text-lg font-bold text-white hover:text-blue-400 transition-colors">
                      {holding.name}
                    </Link>
                    <div className="text-xs text-slate-500 uppercase font-black tracking-widest mt-1">
                      {holding.interestRate}% APY
                    </div>
                   </div>

                   <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-xs text-slate-500 font-medium italic">Principal</span>
                      <span className="font-bold text-slate-300">{formatVND(holding.principal)}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-xs text-slate-500 font-medium italic">Accrued Int.</span>
                      <span className="font-bold text-emerald-400">+{formatVND(holding.accruedInterest)}</span>
                    </div>
                    <div className="pt-2 border-t border-white/5 flex justify-between items-end">
                      <span className="text-xs font-black uppercase text-slate-400">Current Value</span>
                      <span className="text-lg font-black text-white">{formatVND(holding.marketValue)}</span>
                    </div>
                   </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. Real Estate Section */}
      {realEstate.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-purple-400" />
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Real Estate Positions</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {realEstate.map((h) => {
              const holding = h as any; // RealEstateHolding
              const appreciation = holding.currentValuation - holding.purchasePrice;
              const appreciationPct = (appreciation / holding.purchasePrice) * 100;

              return (
                <div key={holding.id} className="glass-premium p-6 rounded-2xl border border-white/5 flex gap-6 group hover:border-white/10 transition-colors">
                  <div className="h-24 w-24 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                    <MapPin className="h-10 w-10 text-slate-600 group-hover:text-purple-400 transition-colors" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <Link href={`/holdings/${holding.id}`} className="text-lg font-bold text-white hover:text-purple-400 transition-colors">
                          {holding.name}
                        </Link>
                        <div className="text-xs text-slate-500 font-medium italic">
                          Purchased @ {formatVND(holding.purchasePrice)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black text-white">{formatVND(holding.marketValue)}</div>
                        <div className={cn(
                          "text-[10px] font-black uppercase",
                          appreciation >= 0 ? "text-emerald-400" : "text-red-400"
                        )}>
                          {appreciation >= 0 ? 'Appreciated ' : 'Depreciated '} {appreciationPct.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                      <Clock className="h-3 w-3" />
                      {holding.status}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
