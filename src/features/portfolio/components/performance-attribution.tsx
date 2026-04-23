import { ArrowDownRight, ArrowUpRight, TrendingUp, Wallet, Landmark, Activity, PiggyBank } from 'lucide-react'
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card'
import { formatPercentage } from '@/lib/formatters'
import { formatVND } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import type { PortfolioSummary } from '../utils'

interface PerformanceAttributionProps {
  summary: PortfolioSummary;
}

export function PerformanceAttribution({ summary }: PerformanceAttributionProps) {
  const {
    portfolioValue,
    totalInvested,
    totalContributions,
    totalWithdrawals,
    netCashFlow
  } = summary;

  const totalCapitalGain = portfolioValue - totalInvested;
  const grossReturns = totalInvested > 0 ? (totalCapitalGain / totalInvested) * 100 : 0;

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      {/* 1. Net Invested Capital */}
      <Card className="glass-premium hover-lift relative overflow-hidden transition-all duration-300 border-white/5">
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-blue-500/10 blur-3xl" />
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardDescription className="text-slate-400 font-medium tracking-wide uppercase text-xs">
              Net Invested Capital
            </CardDescription>
            <PiggyBank className="h-4 w-4 text-blue-500/50" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 text-2xl font-black tracking-tight text-white tabular-nums">
            {formatVND(totalInvested)}
          </div>
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
            Total Capital at Risk
          </div>
        </CardContent>
      </Card>

      {/* 2. Capital Flows */}
      <Card className="glass-premium hover-lift relative overflow-hidden transition-all duration-300 border-white/5">
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-indigo-500/10 blur-3xl" />
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardDescription className="text-slate-400 font-medium tracking-wide uppercase text-xs">
              Capital Flows
            </CardDescription>
            <Landmark className="h-4 w-4 text-indigo-500/50" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-2xl font-black tracking-tight text-white tabular-nums">
            {formatVND(netCashFlow)}
          </div>
          <div className="flex flex-col gap-1 border-t border-white/5 pt-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-tight">Contributions</span>
              <span className="text-xs font-black text-emerald-400">
                + {formatVND(totalContributions)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-tight">Withdrawals</span>
              <span className="text-xs font-black text-slate-300">
                - {formatVND(Math.abs(totalWithdrawals))}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Gross Returns */}
      <Card className="glass-premium hover-lift relative overflow-hidden transition-all duration-300 border-white/5">
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-emerald-500/10 blur-3xl" />
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardDescription className="text-slate-400 font-medium tracking-wide uppercase text-xs">
              Gross Returns
            </CardDescription>
            <Activity className="h-4 w-4 text-emerald-500/50" />
          </div>
        </CardHeader>
        <CardContent>
          <div className={cn(
            "mb-4 text-2xl font-black tracking-tight tabular-nums",
            grossReturns >= 0 ? "text-emerald-400" : "text-rose-400"
          )}>
            {formatPercentage(grossReturns)}
          </div>
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
            Return on Investment (ROI)
          </div>
        </CardContent>
      </Card>

      {/* 4. Total Capital Gain */}
      <Card className="glass-premium hover-lift relative overflow-hidden transition-all duration-300 border-white/5">
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-amber-500/10 blur-3xl" />
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardDescription className="text-slate-400 font-medium tracking-wide uppercase text-xs">
              Total Capital Gain
            </CardDescription>
            <TrendingUp className="h-4 w-4 text-amber-500/50" />
          </div>
        </CardHeader>
        <CardContent>
          <div className={cn(
            "mb-4 text-2xl font-black tracking-tight tabular-nums",
            totalCapitalGain >= 0 ? "text-emerald-400" : "text-rose-400"
          )}>
            {totalCapitalGain >= 0 ? '+' : ''}{formatVND(totalCapitalGain)}
          </div>
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
            Unrealized + Realized Value
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
