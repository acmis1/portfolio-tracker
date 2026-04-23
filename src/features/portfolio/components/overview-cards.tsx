import { DollarSign, PieChart, Activity, ShieldCheck, Landmark } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { getPortfolioSummary } from '../utils'
import { getVietnamMacro } from '../actions/macro'
import { formatPercentage } from '@/lib/formatters'
import { formatVND } from '@/lib/utils/format'
import { cn } from '@/lib/utils'

export async function OverviewCards() {
  const [summary, macro] = await Promise.all([
    getPortfolioSummary(),
    getVietnamMacro()
  ])

  const { totalValue, totalInvested, xirr, totalRealizedPnL } = summary

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      {/* Card 1: Total Net Worth */}
      <Card className="glass-premium hover-lift relative overflow-hidden transition-all duration-300">
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-emerald-500/10 blur-3xl" />
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardDescription className="text-slate-400 font-medium tracking-wide uppercase text-xs">
              Total Net Worth
            </CardDescription>
            <DollarSign className="h-4 w-4 text-emerald-500/50" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 text-2xl font-black tracking-tight text-white">
            {formatVND(totalValue)}
          </div>
          <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs">Live Liquidation Value</span>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Portfolio Performance */}
      <Card className="glass-premium hover-lift relative overflow-hidden transition-all duration-300">
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-blue-500/10 blur-3xl" />
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardDescription className="text-slate-400 font-medium tracking-wide uppercase text-xs">
              Portfolio XIRR
            </CardDescription>
            <Activity className="h-4 w-4 text-blue-500/50" />
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
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-black uppercase">
                Alpha Generated
              </span>
            ) : (
              <span className="text-[10px] bg-slate-500/10 text-slate-500 border border-white/5 px-1.5 py-0.5 rounded font-black uppercase">
                Market Neutral
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Market Benchmarks (Merged) */}
      <Card className="glass-premium hover-lift relative overflow-hidden transition-all duration-300">
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-amber-500/10 blur-3xl" />
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardDescription className="text-slate-400 font-medium tracking-wide uppercase text-xs">
              Market Benchmarks
            </CardDescription>
            <ShieldCheck className="h-4 w-4 text-amber-500/50" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-end">
            <div>
              <div className="text-xs text-slate-500 font-bold uppercase tracking-tight">VN 10Y Bond</div>
              <div className="text-lg font-black text-white">{formatPercentage(macro.riskFreeRate, false)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500 font-bold uppercase tracking-tight">VN-Index CAGR</div>
              <div className="text-lg font-black text-white">{formatPercentage(macro.marketBaseline, false)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 4: Capital Summary */}
      <Card className="glass-premium hover-lift relative overflow-hidden transition-all duration-300">
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-violet-500/10 blur-3xl" />
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardDescription className="text-slate-400 font-medium tracking-wide uppercase text-xs">
              Capital Summary
            </CardDescription>
            <PieChart className="h-4 w-4 text-violet-500/50" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-end">
            <div>
              <div className="text-xs text-slate-500 font-bold uppercase tracking-tight">Invested</div>
              <div className="text-lg font-black text-white">{formatVND(totalInvested)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500 font-bold uppercase tracking-tight">Realized PnL</div>
              <div className={cn(
                "text-lg font-black",
                totalRealizedPnL >= 0 ? "text-emerald-400" : "text-red-400"
              )}>
                {totalRealizedPnL >= 0 ? "+" : ""}{formatVND(totalRealizedPnL)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
