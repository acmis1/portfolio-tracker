import { Wallet, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatVND, formatQuantity, formatAssetDisplay } from "@/lib/utils/format";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface LiquidTableProps {
  assets: any[];
  paginatedAssets: any[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function LiquidTable({
  assets,
  paginatedAssets,
  currentPage,
  totalPages,
  onPageChange
}: LiquidTableProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-emerald-400" />
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Liquid Positions</h2>
        </div>
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          {assets.length} Holdings
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
              {paginatedAssets.map((holding: any) => (
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
                onClick={(e) => { e.stopPropagation(); onPageChange(Math.max(1, currentPage - 1)); }}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-white" />
              </button>
              <button 
                disabled={currentPage === totalPages}
                onClick={(e) => { e.stopPropagation(); onPageChange(Math.min(totalPages, currentPage + 1)); }}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
