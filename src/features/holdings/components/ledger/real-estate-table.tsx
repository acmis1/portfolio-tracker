import { Building2, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatVND, formatAssetDisplay } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface RealEstateTableProps {
  assets: any[];
}

export function RealEstateTable({ assets }: RealEstateTableProps) {
  const router = useRouter();
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-purple-400" />
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Real Estate</h2>
        </div>
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          {assets.length} Properties
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
              {assets.map((holding: any) => (
                <tr 
                  key={holding.id} 
                  className="hover:bg-white/5 transition-colors group cursor-pointer" 
                  onClick={() => router.push(`/holdings/${holding.id}`)}
                >
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
  );
}
