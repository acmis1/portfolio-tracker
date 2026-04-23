import { TrendingUp, TrendingDown, DollarSign, PieChart, Activity } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { getPortfolioSummary } from '../utils'
import { formatCurrency, formatPercentage } from '@/lib/formatters'
import { formatVND } from '@/lib/utils/format'
import { cn } from '@/lib/utils'

export async function OverviewCards() {
  const { totalValue, totalInvested, xirr, totalRealizedPnL } = await getPortfolioSummary()

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
          <div className="mb-4 text-2xl font-black tracking-tight text-white glow-emerald">
            {formatVND(totalValue)}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">
              Current market value
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Portfolio XIRR */}
      <Card className="glass-premium hover-lift relative overflow-hidden transition-all duration-300">
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-blue-500/10 blur-3xl" />
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardDescription className="text-slate-400 font-medium tracking-wide uppercase text-xs">
              Annualized Yield
            </CardDescription>
            <Activity className="h-4 w-4 text-blue-500/50" />
          </div>
        </CardHeader>
        <CardContent>
          <div className={`mb-4 text-2xl font-black tracking-tight ${xirr >= 0 ? 'text-white glow-emerald' : 'text-red-400'}`}>
            {formatPercentage(xirr)}
          </div>
          <div className="flex items-center gap-1.5">
            {Math.abs(xirr) > 0.0001 ? (
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Institutional Yield Status: <span className={xirr >= 0 ? "text-emerald-500" : "text-red-400"}>Current Yield</span>
              </span>
            ) : (
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                No return history yet
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Realized P&L */}
      <Card className="glass-premium hover-lift relative overflow-hidden transition-all duration-300">
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-amber-500/10 blur-3xl" />
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardDescription className="text-slate-400 font-medium tracking-wide uppercase text-xs">
              Realized Gains
            </CardDescription>
            {totalRealizedPnL >= 0 ? (
              <TrendingUp className="h-4 w-4 text-emerald-500/50" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500/50" />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className={cn(
            "mb-4 text-2xl font-black tracking-tight",
            totalRealizedPnL >= 0 ? "text-white glow-emerald" : "text-red-400"
          )}>
            {formatVND(totalRealizedPnL)}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">
              Locked-in profit/loss
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Card 4: Total Invested */}
      <Card className="glass-premium hover-lift relative overflow-hidden transition-all duration-300">
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-violet-500/10 blur-3xl" />
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardDescription className="text-slate-400 font-medium tracking-wide uppercase text-xs">
              Total Invested
            </CardDescription>
            <PieChart className="h-4 w-4 text-violet-500/50" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 text-2xl font-black tracking-tight text-white">
            {formatVND(totalInvested)}
          </div>
          <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs">Net Capital Deployed</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
