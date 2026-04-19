import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency, formatPercentage } from '@/lib/formatters'
import { cn } from '@/lib/utils'

interface PerformanceAttributionProps {
  data: {
    name: string;
    marketValue: number;
    netInvested: number;
    roi: number;
  }[];
}

export function PerformanceAttribution({ data }: PerformanceAttributionProps) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {data.map((item) => (
        <Card key={item.name} className="glass-premium overflow-hidden border-white/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                {item.name}
              </span>
              <span className={cn(
                "text-sm font-bold tabular-nums",
                item.roi > 0 ? "text-emerald-500" : item.roi < 0 ? "text-rose-500" : "text-slate-400"
              )}>
                {item.roi > 0 ? "+" : ""}{formatPercentage(item.roi)}
              </span>
            </div>
            
            <div className="space-y-1">
              <div className="text-xl font-black tracking-tight text-white">
                {formatCurrency(item.marketValue)}
              </div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Current Exposure
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Net Cost Basis
              </span>
              <span className="text-xs font-bold text-slate-300">
                {formatCurrency(item.netInvested)}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
