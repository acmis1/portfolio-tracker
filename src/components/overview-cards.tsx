import { TrendingUp, TrendingDown, DollarSign, PieChart, Activity } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getPortfolioSummary } from '@/lib/portfolio'
import { formatCurrency, formatPercentage } from '@/lib/formatters'

export async function OverviewCards() {
  const { totalValue, xirr, assetCount } = await getPortfolioSummary()

  return (
    <div className="grid gap-6 md:grid-cols-3">
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
          <div className="mb-4 text-4xl font-black tracking-tight text-white glow-emerald">
            {formatCurrency(totalValue)}
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 rounded-full px-3 py-1 ${xirr >= 0 ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
              {xirr >= 0 ? (
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-400" />
              )}
              <span className={`text-sm font-bold ${xirr >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatPercentage(xirr)}
              </span>
            </div>
            <span className="text-xs font-medium text-slate-500">
              lifetime growth
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
              Portfolio XIRR
            </CardDescription>
            <Activity className="h-4 w-4 text-blue-500/50" />
          </div>
        </CardHeader>
        <CardContent>
          <div className={`mb-4 text-4xl font-black tracking-tight ${xirr >= 0 ? 'text-white glow-emerald' : 'text-red-400'}`}>
            {formatPercentage(xirr)}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={xirr >= 0 ? "success" : "destructive"} className="rounded-md border-0 uppercase tracking-tighter font-black py-0.5">
              {xirr >= 0 ? "Bullish Return" : "Bearing"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Active Assets */}
      <Card className="glass-premium hover-lift relative overflow-hidden transition-all duration-300">
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-violet-500/10 blur-3xl" />
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardDescription className="text-slate-400 font-medium tracking-wide uppercase text-xs">
              Active Holdings
            </CardDescription>
            <PieChart className="h-4 w-4 text-violet-500/50" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 text-4xl font-black tracking-tight text-white">
            {assetCount}
          </div>
          <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Positions
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
