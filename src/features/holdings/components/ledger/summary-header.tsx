import { PieChart, ShieldCheck, TrendingUp } from "lucide-react";
import { formatVND } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

interface SummaryHeaderProps {
  portfolioValue: number;
  totalRealizedPnL: number;
  assetCount: number;
  top3Concentration: number;
}

export function SummaryHeader({ 
  portfolioValue, 
  totalRealizedPnL, 
  assetCount, 
  top3Concentration 
}: SummaryHeaderProps) {
  return (
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
  );
}
