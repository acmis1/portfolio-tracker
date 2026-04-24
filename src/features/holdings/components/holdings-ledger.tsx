"use client"

import { useState, useMemo } from "react";
import { type PortfolioSummary } from "@/features/portfolio/utils";
import { formatCurrency } from "@/lib/formatters";
import { formatVND, formatNumberDots } from "@/lib/utils/format";
import { TrendingUp, TrendingDown, Clock, MapPin, Building2, Wallet, ShieldCheck, PieChart, Search, Filter, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface HoldingsLedgerProps {
  summary: PortfolioSummary;
  fxRate: number;
}

export function HoldingsLedger({ summary, fxRate }: HoldingsLedgerProps) {
  const { holdings, portfolioValue, totalRealizedPnL, assetCount } = summary;
  
  const [search, setSearch] = useState("");
  const [activeClass, setActiveClass] = useState<string>("ALL");

  const assetClasses = useMemo(() => {
    const classes = new Set(holdings.map(h => h.assetClass));
    return ["ALL", ...Array.from(classes)];
  }, [holdings]);

  const filteredHoldings = useMemo(() => {
    return holdings.filter(h => {
      const matchesSearch = 
        h.name.toLowerCase().includes(search.toLowerCase()) || 
        h.symbol.toLowerCase().includes(search.toLowerCase());
      
      const matchesClass = activeClass === "ALL" || h.assetClass === activeClass;
      
      return matchesSearch && matchesClass;
    });
  }, [holdings, search, activeClass]);

  const liquidAssets = filteredHoldings.filter(h => h.type === 'LIQUID' || h.type === 'GOLD');
  const termDeposits = filteredHoldings.filter(h => h.type === 'TERM_DEPOSIT');
  const realEstate = filteredHoldings.filter(h => h.type === 'REAL_ESTATE');

  const hasAnyResults = filteredHoldings.length > 0;

  return (
    <div className="space-y-10">
      {/* 1. Statistics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-premium p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-emerald-500/5 blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
          <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
            <PieChart className="h-3 w-3" />
            Asset Market Value
          </div>
          <div className="text-3xl font-black text-white">
            {formatVND(portfolioValue)}
          </div>
        </div>

        <div className="glass-premium p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-indigo-500/5 blur-2xl group-hover:bg-indigo-500/10 transition-colors" />
          <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
            <ShieldCheck className="h-3 w-3" />
            Realized Profit
          </div>
          <div className={cn(
            "text-3xl font-black",
            totalRealizedPnL >= 0 ? "text-emerald-400" : "text-rose-400"
          )}>
            {totalRealizedPnL >= 0 ? '+' : ''}{formatVND(totalRealizedPnL)}
          </div>
        </div>

        <div className="glass-premium p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-blue-500/5 blur-2xl group-hover:bg-blue-500/10 transition-colors" />
          <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
            <Building2 className="h-3 w-3" />
            Active Positions
          </div>
          <div className="text-3xl font-black text-white">
            {assetCount} <span className="text-sm font-bold text-slate-500 uppercase tracking-widest ml-1">Assets</span>
          </div>
        </div>
      </div>

      {/* 2. Search & Filters */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between px-1">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets by name or symbol..."
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 rounded-xl focus:ring-emerald-500/20"
          />
          {search && (
            <button 
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 mr-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
            <Filter className="h-3 w-3" />
            Filter
          </div>
          <div className="flex flex-wrap gap-1.5">
            {assetClasses.map((cls) => (
              <button
                key={cls}
                onClick={() => setActiveClass(cls)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                  activeClass === cls 
                    ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20" 
                    : "bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10"
                )}
              >
                {cls.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!hasAnyResults ? (
        <div className="glass-premium rounded-2xl p-20 text-center border border-white/5">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-slate-900 flex items-center justify-center border border-white/5">
              <Search className="h-8 w-8 text-slate-700" />
            </div>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No results found</h3>
          <p className="text-slate-500 text-sm max-w-xs mx-auto">
            We couldn't find any assets matching your search criteria. Try adjusting your filters.
          </p>
          <button 
            onClick={() => { setSearch(""); setActiveClass("ALL"); }}
            className="mt-6 text-xs font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="space-y-12">
          {/* 3. Liquid Assets Section */}
          {liquidAssets.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-emerald-400" />
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Liquid Holdings</h2>
              </div>
              <div className="glass-premium rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
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
                      {liquidAssets.map((holding: any) => {
                        const isUSD = holding.currency === 'USD';
                        const displayAvgCost = isUSD ? holding.avgCost / fxRate : holding.avgCost;
                        const displayLivePrice = isUSD && holding.livePrice !== null ? holding.livePrice / fxRate : holding.livePrice;

                        return (
                          <tr key={holding.id} className="hover:bg-white/5 transition-colors group">
                            <td className="px-6 py-4">
                              <Link href={`/holdings/${holding.id}`} className="flex flex-col group/link">
                                <span className="font-bold text-white group-hover/link:text-emerald-400 transition-colors">{holding.symbol}</span>
                                <span className="text-xs text-slate-500">{holding.name}</span>
                              </Link>
                            </td>
                            <td className="px-6 py-4 text-right font-medium text-slate-300 tabular-nums">
                              {formatNumberDots(holding.quantity)}
                            </td>
                            <td className="px-6 py-4 text-right font-medium text-slate-300 tabular-nums">
                              {formatCurrency(displayAvgCost, holding.currency)}
                            </td>
                            <td className="px-6 py-4 text-right font-medium text-slate-300 tabular-nums">
                              {displayLivePrice !== null ? formatCurrency(displayLivePrice, holding.currency) : "N/A"}
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-white tabular-nums">
                              {formatVND(holding.marketValue)}
                            </td>
                            <td className="px-6 py-4 text-right">
                              {holding.unrealizedPnLPctg !== null ? (
                                <div className={cn(
                                  "inline-flex items-center gap-1 font-black px-2 py-0.5 rounded-full text-[10px] tabular-nums",
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

          {/* 4. Term Deposits Section */}
          {termDeposits.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-400" />
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Term Deposits</h2>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {termDeposits.map((holding: any) => (
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
                        <span className="font-bold text-slate-300 tabular-nums">{formatVND(holding.principal)}</span>
                      </div>
                      <div className="flex justify-between items-end">
                        <span className="text-xs text-slate-500 font-medium italic">Accrued Int.</span>
                        <span className="font-bold text-emerald-400 tabular-nums">+{formatVND(holding.accruedInterest)}</span>
                      </div>
                      <div className="pt-2 border-t border-white/5 flex justify-between items-end">
                        <span className="text-xs font-black uppercase text-slate-400">Current Value</span>
                        <span className="text-lg font-black text-white tabular-nums">{formatVND(holding.marketValue)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 5. Real Estate Section */}
          {realEstate.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-purple-400" />
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Real Estate Positions</h2>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                {realEstate.map((holding: any) => {
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
                            <div className="text-xl font-black text-white tabular-nums">{formatVND(holding.marketValue)}</div>
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
      )}
    </div>
  );
}
