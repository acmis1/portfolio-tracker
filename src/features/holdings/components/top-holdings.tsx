import { getHoldingsLedger, AssetHolding } from "@/features/portfolio/utils";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export async function TopHoldings() {
  const allHoldings = await getHoldingsLedger();
  const topHoldings = allHoldings.slice(0, 5);

  if (topHoldings.length === 0) return null;

  return (
    <div className="glass-premium rounded-2xl border border-white/5 overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-6 py-4">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">
          Top Holdings
        </h3>
        <Link 
          href="/holdings" 
          className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors"
        >
          View All <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
      
      <div className="divide-y divide-white/5">
        {topHoldings.map((holding) => (
          <div key={holding.id} className="flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors group">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Link 
                  href={`/holdings/${holding.id}`}
                  className="font-bold text-white hover:text-emerald-400 transition-colors"
                >
                  {holding.symbol}
                </Link>
                <span className="text-[10px] font-black text-slate-500 uppercase">
                  {holding.weight.toFixed(1)}%
                </span>
              </div>
              <span className="text-xs text-slate-500 truncate max-w-[120px]">{holding.name}</span>
            </div>

            <div className="text-right">
              <div className="font-bold text-white">
                {formatCurrency(holding.marketValue, 'VND')}
              </div>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                {holding.type === 'LIQUID' && holding.unrealizedPnLPctg !== null ? (
                  <>
                    <span className={cn(
                      "text-[10px] font-black tracking-tighter",
                      holding.unrealizedPnLPctg >= 0 ? "text-emerald-500" : "text-red-500"
                    )}>
                      {holding.unrealizedPnLPctg >= 0 ? '+' : ''}{formatPercentage(holding.unrealizedPnLPctg)}
                    </span>
                    {holding.unrealizedPnLPctg >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                  </>
                ) : (
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    {holding.status}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
