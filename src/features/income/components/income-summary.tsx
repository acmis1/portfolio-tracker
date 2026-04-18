import { DollarSign, Calendar, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { formatCurrency } from '@/lib/formatters'

interface IncomeSummaryProps {
  summary: {
    totalYTD: number;
    totalAllTime: number;
    avgMonthly: number;
  }
}

export function IncomeSummary({ summary }: IncomeSummaryProps) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Total YTD Income */}
      <Card className="glass-premium hover-lift relative overflow-hidden transition-all duration-300">
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-emerald-500/10 blur-3xl" />
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardDescription className="text-slate-400 font-medium tracking-wide uppercase text-xs">
              Total YTD Income
            </CardDescription>
            <TrendingUp className="h-4 w-4 text-emerald-500/50" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 text-4xl font-black tracking-tight text-white glow-emerald">
            {formatCurrency(summary.totalYTD)}
          </div>
          <div className="text-xs font-medium text-slate-500">
            Current calendar year revenue
          </div>
        </CardContent>
      </Card>

      {/* Average Monthly Income */}
      <Card className="glass-premium hover-lift relative overflow-hidden transition-all duration-300">
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-blue-500/10 blur-3xl" />
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardDescription className="text-slate-400 font-medium tracking-wide uppercase text-xs">
              Monthly Average
            </CardDescription>
            <Calendar className="h-4 w-4 text-blue-500/50" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 text-4xl font-black tracking-tight text-white glow-blue">
            {formatCurrency(summary.avgMonthly)}
          </div>
          <div className="text-xs font-medium text-slate-500">
            Trailing 12-month mean
          </div>
        </CardContent>
      </Card>

      {/* Total All-Time Income */}
      <Card className="glass-premium hover-lift relative overflow-hidden transition-all duration-300">
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-violet-500/10 blur-3xl" />
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardDescription className="text-slate-400 font-medium tracking-wide uppercase text-xs">
              All-Time Revenue
            </CardDescription>
            <DollarSign className="h-4 w-4 text-violet-500/50" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 text-4xl font-black tracking-tight text-white">
            {formatCurrency(summary.totalAllTime)}
          </div>
          <div className="text-xs font-medium text-slate-500">
            Cumulative passive cash flow
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
