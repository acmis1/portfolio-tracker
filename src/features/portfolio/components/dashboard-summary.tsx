import { DollarSign, Activity, TrendingUp, ShieldCheck } from 'lucide-react'
import { CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { GlassCard } from '@/components/ui/glass-card'
import { type PortfolioSummary } from '../utils'
import { formatPercentage } from '@/lib/formatters'
import { formatVND } from '@/lib/utils/format'
import { cn } from '@/lib/utils'

interface DashboardSummaryProps {
  summary: PortfolioSummary;
  macro: {
    riskFreeRate: number;
    marketBaseline: number;
  };
}

export function DashboardSummary({ summary, macro }: DashboardSummaryProps) {
  const { 
    portfolioValue, 
    xirr, 
    totalRealizedPnL,
    totalInvested
  } = summary

  const totalCapitalGain = portfolioValue - totalInvested;
  const grossReturns = totalInvested > 0 ? (totalCapitalGain / totalInvested) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Primary KPI Row */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {/* 1. Portfolio Market Value */}
        <GlassCard hoverLift padding="none" className="relative overflow-hidden border-white/10">
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
            <div className="text-2xl font-black tracking-tight text-white mb-1">
              {formatVND(portfolioValue)}
            </div>
            <div className="text-[10px] uppercase font-black tracking-wider text-slate-500 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Asset Valuation
            </div>
          </CardContent>
        </GlassCard>

        {/* 2. Total Return (Combined) */}
        <GlassCard hoverLift padding="none" className="relative overflow-hidden border-white/10">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-blue-500/10 blur-3xl" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-slate-400 font-medium tracking-wide uppercase text-xs">
                Total Return
              </CardDescription>
              <TrendingUp className="h-4 w-4 text-blue-500/50" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-black tracking-tight mb-1",
              totalCapitalGain >= 0 ? "text-emerald-400" : "text-rose-400"
            )}>
              {totalCapitalGain >= 0 ? '+' : ''}{formatVND(totalCapitalGain)}
            </div>
            <div className={cn(
              "text-xs font-black flex items-center gap-1",
              grossReturns >= 0 ? "text-emerald-500/80" : "text-rose-500/80"
            )}>
              {formatPercentage(grossReturns)}
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tight ml-1">Overall ROI</span>
            </div>
          </CardContent>
        </GlassCard>

        {/* 3. Realized PnL */}
        <GlassCard hoverLift padding="none" className="relative overflow-hidden border-white/10">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-indigo-500/10 blur-3xl" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-slate-400 font-medium tracking-wide uppercase text-xs">
                Realized PnL
              </CardDescription>
              <ShieldCheck className="h-4 w-4 text-indigo-500/50" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-black tracking-tight mb-1",
              totalRealizedPnL >= 0 ? "text-emerald-400" : "text-rose-400"
            )}>
              {totalRealizedPnL >= 0 ? '+' : ''}{formatVND(totalRealizedPnL)}
            </div>
            <div className="text-[10px] uppercase font-black tracking-wider text-slate-500 flex items-center gap-1.5">
              Actual Profit Taken
            </div>
          </CardContent>
        </GlassCard>

        {/* 4. Portfolio XIRR */}
        <GlassCard hoverLift padding="none" className="relative overflow-hidden border-white/10">
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
              "text-2xl font-black tracking-tight mb-1",
              xirr >= 0 ? "text-emerald-400" : "text-rose-400"
            )}>
              {formatPercentage(xirr)}
            </div>
            <div className="flex items-center gap-2">
              {xirr >= macro.marketBaseline ? (
                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">
                  Alpha Generated
                </span>
              ) : (
                <span className="text-[9px] text-slate-500 font-black uppercase tracking-tighter">
                  Money-Weighted
                </span>
              )}
            </div>
          </CardContent>
        </GlassCard>
      </div>

      {/* Secondary Compact Strip */}
      <div className="px-1 flex items-center gap-6">
        <div className="flex flex-col gap-1 border-l-2 border-white/5 pl-4 py-1">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Net Invested</span>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-black text-slate-200 tabular-nums">{formatVND(totalInvested)}</span>
            <span className="text-[9px] text-slate-500 font-bold italic">Cost basis of active tracked positions</span>
          </div>
        </div>
      </div>
    </div>
  )
}
