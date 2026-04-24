"use client"

import { useState, useMemo } from "react";
import { type AssetHolding, type PortfolioSummary } from "@/features/portfolio/utils";
import { formatCurrency } from "@/lib/formatters";
import { formatVND, formatQuantity, formatCompactVND, formatAssetDisplay } from "@/lib/utils/format";
import { 
  TrendingUp, TrendingDown, Clock, MapPin, Building2, Wallet, 
  ShieldCheck, PieChart, Search, Filter, X, ArrowUpDown, 
  Calendar, Percent, ArrowUpRight, Info, ChevronLeft, ChevronRight
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface HoldingsLedgerProps {
  summary: PortfolioSummary;
  fxRate: number;
}

type SortOption = "VALUE_DESC" | "VALUE_ASC" | "ROI_DESC" | "ROI_ASC" | "NAME_ASC";

const ITEMS_PER_PAGE = 25;

export function HoldingsLedger({ summary, fxRate }: HoldingsLedgerProps) {
  const { holdings, portfolioValue, totalRealizedPnL, assetCount } = summary;
  
  const [search, setSearch] = useState("");
  const [activeClass, setActiveClass] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("VALUE_DESC");
  const [currentPage, setCurrentPage] = useState(1);

  const assetClasses = useMemo(() => {
    const classes = new Set(holdings.map(h => h.assetClass));
    return ["ALL", ...Array.from(classes)].filter(c => c !== 'CASH');
  }, [holdings]);

  const visibleClasses = assetClasses.slice(0, 5);
  const overflowClasses = assetClasses.slice(5);

  const filteredAndSortedHoldings = useMemo(() => {
    let result = holdings.filter(h => {
      const matchesSearch = 
        h.name.toLowerCase().includes(search.toLowerCase()) || 
        h.symbol.toLowerCase().includes(search.toLowerCase());
      
      const matchesClass = activeClass === "ALL" || h.assetClass === activeClass;
      const notCash = h.assetClass !== 'CASH';
      
      return matchesSearch && matchesClass && notCash;
    });

    return result.sort((a, b) => {
      const aVal = a as any;
      const bVal = b as any;
      switch (sortBy) {
        case "VALUE_DESC": return b.marketValue - a.marketValue;
        case "VALUE_ASC": return a.marketValue - b.marketValue;
        case "ROI_DESC": return (bVal.unrealizedPnLPctg ?? -Infinity) - (aVal.unrealizedPnLPctg ?? -Infinity);
        case "ROI_ASC": return (aVal.unrealizedPnLPctg ?? Infinity) - (bVal.unrealizedPnLPctg ?? Infinity);
        case "NAME_ASC": return a.name.localeCompare(b.name);
        default: return 0;
      }
    });
  }, [holdings, search, activeClass, sortBy]);

  const liquidAssets = filteredAndSortedHoldings.filter(h => h.type === 'LIQUID' || h.type === 'GOLD');
  const termDeposits = filteredAndSortedHoldings.filter(h => h.type === 'TERM_DEPOSIT');
  const realEstate = filteredAndSortedHoldings.filter(h => h.type === 'REAL_ESTATE');

  // Pagination for Liquid Assets (only if volume is high)
  const paginatedLiquid = useMemo(() => {
    if (liquidAssets.length <= ITEMS_PER_PAGE) return liquidAssets;
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return liquidAssets.slice(start, start + ITEMS_PER_PAGE);
  }, [liquidAssets, currentPage]);

  const totalPages = Math.ceil(liquidAssets.length / ITEMS_PER_PAGE);

  const top3Concentration = useMemo(() => {
    const top3 = [...holdings]
      .filter(h => h.assetClass !== 'CASH')
      .sort((a, b) => b.marketValue - a.marketValue)
      .slice(0, 3);
    const top3Sum = top3.reduce((sum, h) => sum + h.marketValue, 0);
    return portfolioValue > 0 ? (top3Sum / portfolioValue) * 100 : 0;
  }, [holdings, portfolioValue]);

  const hasAnyResults = filteredAndSortedHoldings.length > 0;

  return (
    <div className="space-y-8">
      {/* 1. Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="glass-premium p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-emerald-500/5 blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
          <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
            <PieChart className="h-3 w-3" />
            Net Asset Value
          </div>
          <div className="text-3xl font-black text-white">{formatVND(portfolioValue)}</div>
          <div className="mt-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            Spread across {assetCount} positions
          </div>
        </div>

        <div className="glass-premium p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-blue-500/5 blur-2xl group-hover:bg-blue-500/10 transition-colors" />
          <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
            <ShieldCheck className="h-3 w-3" />
            Realized Profit
          </div>
          <div className={cn("text-3xl font-black", totalRealizedPnL >= 0 ? "text-emerald-400" : "text-rose-400")}>
            {totalRealizedPnL >= 0 ? '+' : ''}{formatVND(totalRealizedPnL)}
          </div>
          <div className="mt-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            Life-to-date booked gains
          </div>
        </div>

        <div className="glass-premium p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-amber-500/5 blur-2xl group-hover:bg-amber-500/10 transition-colors" />
          <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
            <TrendingUp className="h-3 w-3" />
            Concentration
          </div>
          <div className="text-3xl font-black text-white">{top3Concentration.toFixed(1)}%</div>
          <div className="mt-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            Top 3 Position Weight
          </div>
        </div>
      </div>

      {/* 2. Controls Toolbar */}
      <div className="flex flex-col gap-4 bg-slate-900/40 p-4 rounded-2xl border border-white/5 shadow-xl">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          {/* Search */}
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search by name or symbol..."
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 rounded-xl"
            />
          </div>

          {/* Sort */}
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap flex items-center gap-2">
              <ArrowUpDown className="h-3 w-3" />
              Sort By
            </div>
            <Select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="h-9 min-w-[160px] text-xs font-bold bg-white/5 border-white/10"
            >
              <option value="VALUE_DESC">Largest Value</option>
              <option value="VALUE_ASC">Smallest Value</option>
              <option value="ROI_DESC">Best ROI</option>
              <option value="ROI_ASC">Worst ROI</option>
              <option value="NAME_ASC">Name A-Z</option>
            </Select>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 mr-2">
            <Filter className="h-3 w-3" />
            Class Filter
          </div>
          <div className="flex flex-wrap gap-1.5">
            {visibleClasses.map((cls) => (
              <button
                key={cls}
                onClick={() => { setActiveClass(cls); setCurrentPage(1); }}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                  activeClass === cls 
                    ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20" 
                    : "bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10"
                )}
              >
                {cls.replace('_', ' ')}
              </button>
            ))}
            {overflowClasses.length > 0 && (
              <Select 
                value={overflowClasses.includes(activeClass) ? activeClass : ""}
                onChange={(e) => { setActiveClass(e.target.value); setCurrentPage(1); }}
                className={cn(
                  "h-8 px-2 py-0 w-auto min-w-[110px] text-[10px] font-black uppercase border-0",
                  overflowClasses.includes(activeClass) ? "bg-emerald-500 text-slate-950" : "bg-white/5 text-slate-400"
                )}
              >
                <option value="" disabled>More...</option>
                {overflowClasses.map(cls => (
                  <option key={cls} value={cls}>{cls.replace('_', ' ')}</option>
                ))}
              </Select>
            )}
          </div>
        </div>
      </div>

      {!hasAnyResults ? (
        <div className="glass-premium rounded-2xl p-20 text-center border border-white/5">
          <h3 className="text-lg font-bold text-white mb-2">No positions found</h3>
          <p className="text-slate-500 text-sm mb-6">Try adjusting your filters or search terms.</p>
          <button 
            onClick={() => { setSearch(""); setActiveClass("ALL"); }}
            className="text-xs font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Reset all filters
          </button>
        </div>
      ) : (
        <div className="space-y-16">
          {/* 3. Liquid Positions Section */}
          {liquidAssets.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-emerald-400" />
                  <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Liquid Positions</h2>
                </div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {liquidAssets.length} Holdings
                </div>
              </div>
              <div className="glass-premium rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/5">
                        <th className="px-6 py-4 font-black uppercase tracking-wider text-slate-500 text-[10px]">Asset</th>
                        <th className="px-6 py-4 text-right font-black uppercase tracking-wider text-slate-500 text-[10px]">Qty</th>
                        <th className="px-6 py-4 text-right font-black uppercase tracking-wider text-slate-500 text-[10px]">Avg Cost</th>
                        <th className="px-6 py-4 text-right font-black uppercase tracking-wider text-slate-500 text-[10px]">Live Price</th>
                        <th className="px-6 py-4 text-right font-black uppercase tracking-wider text-slate-500 text-[10px]">Value (VND)</th>
                        <th className="px-6 py-4 text-right font-black uppercase tracking-wider text-slate-500 text-[10px]">ROI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {paginatedLiquid.map((holding: any) => (
                        <tr key={holding.id} className="hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => window.location.href = `/holdings/${holding.id}`}>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              {(() => {
                                const labels = formatAssetDisplay(holding.symbol, holding.name);
                                return (
                                  <>
                                    <span className="font-bold text-white group-hover:text-emerald-400 transition-colors">{labels.primary}</span>
                                    {labels.secondary && (
                                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter truncate max-w-[150px]">{labels.secondary}</span>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-slate-300 tabular-nums">
                            {formatQuantity(holding.quantity)}
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-slate-500 tabular-nums text-xs">
                            {formatCurrency(holding.avgCost, holding.currency)}
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-slate-300 tabular-nums text-xs">
                            {holding.livePrice ? formatCurrency(holding.livePrice, holding.currency) : "—"}
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-white tabular-nums">
                            {formatVND(holding.marketValue)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {holding.unrealizedPnLPctg !== null ? (
                              <Badge variant="outline" className={cn(
                                "border-0 font-black tabular-nums h-6",
                                holding.unrealizedPnLPctg >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                              )}>
                                {holding.unrealizedPnLPctg >= 0 ? '+' : ''}{holding.unrealizedPnLPctg.toFixed(2)}%
                              </Badge>
                            ) : <span className="text-[10px] text-slate-500 italic lowercase tracking-widest">{holding.status}</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 bg-white/5 border-t border-white/5">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        disabled={currentPage === 1}
                        onClick={(e) => { e.stopPropagation(); setCurrentPage(prev => Math.max(1, prev - 1)); }}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors"
                      >
                        <ChevronLeft className="h-4 w-4 text-white" />
                      </button>
                      <button 
                        disabled={currentPage === totalPages}
                        onClick={(e) => { e.stopPropagation(); setCurrentPage(prev => Math.min(totalPages, prev + 1)); }}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors"
                      >
                        <ChevronRight className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* 4. Term Deposits Section - Scalable Table */}
          {termDeposits.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-400" />
                  <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Term Deposits</h2>
                </div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {termDeposits.length} Accounts
                </div>
              </div>
              <div className="glass-premium rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/5">
                        <th className="px-6 py-4 font-black uppercase tracking-wider text-slate-500 text-[10px]">Institution / Name</th>
                        <th className="px-6 py-4 text-right font-black uppercase tracking-wider text-slate-500 text-[10px]">Yield</th>
                        <th className="px-6 py-4 text-right font-black uppercase tracking-wider text-slate-500 text-[10px]">Principal</th>
                        <th className="px-6 py-4 text-right font-black uppercase tracking-wider text-slate-500 text-[10px]">Accrued Int.</th>
                        <th className="px-6 py-4 text-right font-black uppercase tracking-wider text-slate-500 text-[10px]">Maturity</th>
                        <th className="px-6 py-4 text-right font-black uppercase tracking-wider text-slate-500 text-[10px]">Total Value</th>
                        <th className="px-6 py-4 text-right font-black uppercase tracking-wider text-slate-500 text-[10px]">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {termDeposits.map((holding: any) => (
                        <tr key={holding.id} className="hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => window.location.href = `/holdings/${holding.id}`}>
                          <td className="px-6 py-4">
                            {(() => {
                              const labels = formatAssetDisplay(holding.symbol, holding.name);
                              return (
                                <>
                                  <div className="font-bold text-white group-hover:text-blue-400 transition-colors">{labels.primary}</div>
                                  {labels.secondary && (
                                    <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-0.5">{labels.secondary}</div>
                                  )}
                                </>
                              );
                            })()}
                            <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-0.5">Started {new Date(holding.startDate).toLocaleDateString('vi-VN')}</div>
                          </td>
                          <td className="px-6 py-4 text-right font-black text-emerald-400 tabular-nums">
                            {holding.interestRate}%
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-slate-300 tabular-nums text-xs">
                            {formatVND(holding.principal)}
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-emerald-500 tabular-nums text-xs">
                            +{formatVND(holding.accruedInterest)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="text-white font-bold text-xs">{new Date(holding.maturityDate).toLocaleDateString('vi-VN')}</div>
                            <div className="text-[9px] text-slate-500 font-bold uppercase">{holding.daysToMaturity} days left</div>
                          </td>
                          <td className="px-6 py-4 text-right font-black text-white tabular-nums">
                            {formatVND(holding.marketValue)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Badge variant="outline" className={cn(
                              "border-0 text-[9px] uppercase font-black px-2",
                              holding.daysToMaturity <= 0 ? "bg-rose-500/10 text-rose-400" : "bg-blue-500/10 text-blue-400"
                            )}>
                              {holding.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* 5. Real Estate Section - Scalable Table */}
          {realEstate.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-purple-400" />
                  <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Real Estate</h2>
                </div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {realEstate.length} Properties
                </div>
              </div>
              <div className="glass-premium rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/5">
                        <th className="px-6 py-4 font-black uppercase tracking-wider text-slate-500 text-[10px]">Property Name</th>
                        <th className="px-6 py-4 text-right font-black uppercase tracking-wider text-slate-500 text-[10px]">Valuation Date</th>
                        <th className="px-6 py-4 text-right font-black uppercase tracking-wider text-slate-500 text-[10px]">Market Value</th>
                        <th className="px-6 py-4 text-right font-black uppercase tracking-wider text-slate-500 text-[10px]">Gain/Loss (VND)</th>
                        <th className="px-6 py-4 text-right font-black uppercase tracking-wider text-slate-500 text-[10px]">ROI</th>
                        <th className="px-6 py-4 text-right font-black uppercase tracking-wider text-slate-500 text-[10px]">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {realEstate.map((holding: any) => (
                        <tr key={holding.id} className="hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => window.location.href = `/holdings/${holding.id}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-white/5 group-hover:bg-purple-500/10 transition-colors">
                                <MapPin className="h-3 w-3 text-slate-500 group-hover:text-purple-400" />
                              </div>
                              <div className="flex flex-col">
                                {(() => {
                                  const labels = formatAssetDisplay(holding.symbol, holding.name);
                                  return (
                                    <>
                                      <span className="font-bold text-white group-hover:text-purple-400 transition-colors">{labels.primary}</span>
                                      {labels.secondary && (
                                        <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{labels.secondary}</span>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="text-white font-bold text-xs">
                              {holding.valuationDate ? new Date(holding.valuationDate).toLocaleDateString('vi-VN') : "Manual"}
                            </div>
                            {holding.appraisalAgeDays !== null && (
                              <div className={cn(
                                "text-[9px] font-bold uppercase",
                                holding.appraisalAgeDays > 180 ? "text-amber-500" : "text-slate-500"
                              )}>
                                {holding.appraisalAgeDays} days old
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right font-black text-white tabular-nums">
                            {formatVND(holding.marketValue)}
                          </td>
                          <td className="px-6 py-4 text-right font-bold tabular-nums text-xs">
                            <div className={cn(holding.unrealizedPnL >= 0 ? "text-emerald-400" : "text-rose-400")}>
                              {holding.unrealizedPnL >= 0 ? '+' : ''}{formatVND(holding.unrealizedPnL)}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Badge variant="outline" className={cn(
                              "border-0 font-black tabular-nums h-6",
                              holding.unrealizedPnLPctg >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                            )}>
                              {holding.unrealizedPnLPctg >= 0 ? '+' : ''}{holding.unrealizedPnLPctg.toFixed(1)}%
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{holding.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
