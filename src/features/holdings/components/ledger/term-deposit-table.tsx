import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatVND, formatAssetDisplay } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface TermDepositTableProps {
  assets: any[];
}

export function TermDepositTable({ assets }: TermDepositTableProps) {
  const router = useRouter();
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-400" />
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Term Deposits</h2>
        </div>
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          {assets.length} Accounts
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
              {assets.map((holding: any) => (
                <tr 
                  key={holding.id} 
                  className="hover:bg-white/5 transition-colors group cursor-pointer" 
                  onClick={() => router.push(`/holdings/${holding.id}`)}
                >
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
                    {holding.daysToMaturity > 0 ? (
                      <div className="text-[9px] text-slate-500 font-bold uppercase">{holding.daysToMaturity} days left</div>
                    ) : (
                      <div className="text-[9px] text-rose-500 font-bold uppercase">Matured</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right font-black text-white tabular-nums">
                    {formatVND(holding.marketValue)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Badge variant="outline" className={cn(
                      "border-0 text-[9px] uppercase font-black px-2",
                      holding.daysToMaturity <= 0 ? "bg-rose-500/20 text-rose-400" : "bg-blue-500/10 text-blue-400"
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
  );
}
