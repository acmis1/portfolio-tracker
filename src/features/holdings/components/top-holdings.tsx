import { formatPercentage } from "@/lib/formatters";
import { formatVND, formatAssetDisplay } from "@/lib/utils/format";
import { Trophy, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { type AssetHolding } from "@/features/portfolio/utils";

interface TopHoldingsProps {
  holdings: AssetHolding[];
}

export function TopHoldings({ holdings }: TopHoldingsProps) {
  // Filter out CASH and zero/negative market values for the leaderboard
  const topHoldings = holdings
    .filter(h => h.assetClass !== 'CASH' && h.marketValue > 0)
    .slice(0, 5);

  if (topHoldings.length === 0) {
    return (
      <Card className="glass-premium relative overflow-hidden h-full flex flex-col items-center justify-center p-8 text-center border-white/5">
        <p className="text-slate-500 font-medium tracking-tight">No holdings available yet.</p>
      </Card>
    );
  }

  return (
    <Card className="glass-premium relative overflow-hidden h-full flex flex-col border-white/5">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">
          Top Holdings
        </CardTitle>
        <Trophy className="h-4 w-4 text-amber-500/50" />
      </CardHeader>
      
      <CardContent className="flex-1 px-0 py-0">
        <div className="flex flex-col">
          {topHoldings.map((holding) => {
            const hasPnL = (holding.type === 'LIQUID' || holding.type === 'GOLD') && holding.unrealizedPnLPctg !== null;
            const pnlValue = hasPnL ? (holding as any).unrealizedPnLPctg : null;

            return (
              <div 
                key={holding.id} 
                className="flex items-center justify-between px-6 py-3.5 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors group"
              >
                <div className="flex flex-col min-w-0">
                  {(() => {
                    const labels = formatAssetDisplay(holding.symbol, holding.name);
                    return (
                      <>
                        <Link 
                          href={`/holdings/${holding.id}`}
                          className="font-bold text-white hover:text-emerald-400 transition-colors truncate"
                        >
                          {labels.primary}
                        </Link>
                        {labels.secondary && (
                          <span className="text-[11px] text-slate-500 font-medium truncate max-w-[140px]">
                            {labels.secondary}
                          </span>
                        )}
                      </>
                    );
                  })()}
                </div>

                <div className="text-right flex flex-col items-end shrink-0">
                  <div className="font-bold text-white tabular-nums">
                    {formatVND(holding.marketValue)}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-black text-slate-500/60 uppercase tracking-tighter">
                      {holding.weight.toFixed(1)}%
                    </span>
                    {hasPnL ? (
                      <span className={cn(
                        "text-[10px] font-black tabular-nums",
                        pnlValue! >= 0 ? "text-emerald-500" : "text-rose-500"
                      )}>
                        {formatPercentage(pnlValue!)}
                      </span>
                    ) : (
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight">
                        {holding.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>

      <CardFooter className="pt-4 pb-4">
        <Button 
          asChild
          variant="premium"
          className="w-full group h-9 rounded-xl bg-white/5 border-white/5 text-slate-300 hover:text-white hover:bg-white/10 shadow-none"
        >
          <Link href="/holdings" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
            View All Holdings 
            <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

