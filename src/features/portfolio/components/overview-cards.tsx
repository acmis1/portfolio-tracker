import { DollarSign, PieChart, Activity, ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { type PortfolioSummary } from '../utils'
import { formatPercentage } from '@/lib/formatters'
import { formatVND } from '@/lib/utils/format'
import { cn } from '@/lib/utils'

interface OverviewCardsProps {
  summary: PortfolioSummary;
  macro: {
    riskFreeRate: number;
    marketBaseline: number;
  };
}

export function OverviewCards({ summary, macro }: OverviewCardsProps) {
  const { portfolioValue, cashBalance, netWorth, xirr, totalRealizedPnL } = summary

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      {/* Card 1: Portfolio Market Value */}
      <Card className="glass-premium hover-lift relative overflow-hidden transition-all duration-300 border-white/10">
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-emerald-500/10 blur-3xl" />
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardDescription className="text-slate-400 font-medium tracking-wide uppercase text-xs">
              Portfolio Market Value
            </CardDescription>
            <DollarSign className="h-4 w-4 text-emerald-500/50" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 text-2xl font-black tracking-tight text-white">
            {formatVND(portfolioValue)}
          </div>
          <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] uppercase font-black tracking-wider">Asset Valuation</span>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Cash Balance */}
      <Card className={cn(
        "glass-premium hover-lift relative overflow-hidden transition-all duration-300 border-white/10",
        cashBalance < 0 && "border-amber-500/30"
      )}>
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-blue-500/10 blur-3xl" />
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardDescription className="text-slate-400 font-medium tracking-wide uppercase text-xs">
              Cash Balance
            </CardDescription>
            <PieChart className="h-4 w-4 text-blue-500/50" />
          </div>
        </CardHeader>
        <CardContent>
          <div className={cn(
            "mb-4 text-2xl font-black tracking-tight",
            cashBalance < 0 ? "text-amber-400" : "text-white"
          )}>
            {formatVND(cashBalance)}
          </div>
          {cashBalance < -1000 ? (
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter animate-pulse">
                Ledger Unfunded
              </span>
            </div>
          ) : (
            <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <span className="text-[10px] uppercase font-black tracking-wider">Available Liquidity</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card 3: Portfolio Performance */}
      <Card className="glass-premium hover-lift relative overflow-hidden transition-all duration-300 border-white/10">
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-violet-500/10 blur-3xl" />
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardDescription className="text-slate-400 font-medium tracking-wide uppercase text-xs">
              Portfolio XIRR
            </CardDescription>
            <Activity className="h-4 w-4 text-violet-500/50" />
          </div>
        </CardHeader>
        <CardContent>
          <div className={cn(
            "mb-4 text-2xl font-black tracking-tight",
            xirr >= 0 ? "text-emerald-400" : "text-red-400"
          )}>
            {formatPercentage(xirr)}
          </div>
          <div className="flex items-center gap-2">
            {xirr >= macro.marketBaseline ? (
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">
                Alpha Generated
              </span>
            ) : (
              <span className="text-[10px] bg-slate-500/10 text-slate-500 border border-white/5 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">
                Market Neutral
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Card 4: Net Worth (Equity) */}
      <Card className="glass-premium hover-lift relative overflow-hidden transition-all duration-300 border-white/10">
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-amber-500/10 blur-3xl" />
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardDescription className="text-slate-400 font-medium tracking-wide uppercase text-xs">
              Net Worth (Equity)
            </CardDescription>
            <ShieldCheck className="h-4 w-4 text-amber-500/50" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-2xl font-black tracking-tight text-white mb-4">
            {formatVND(netWorth)}
          </div>
          <div className="flex justify-between items-end border-t border-white/5 pt-2">
            <div>
              <div className="text-[9px] text-slate-500 font-black uppercase tracking-tight">Realized PnL</div>
              <div className={cn(
                "text-xs font-black",
                totalRealizedPnL >= 0 ? "text-emerald-400" : "text-red-400"
              )}>
                {totalRealizedPnL >= 0 ? "+" : ""}{formatVND(totalRealizedPnL)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[9px] text-slate-500 font-black uppercase tracking-tight">Bond Benchmark</div>
              <div className="text-xs font-black text-white">{formatPercentage(macro.riskFreeRate, false)}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

