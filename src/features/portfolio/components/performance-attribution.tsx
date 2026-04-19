import { Building2, Coins, Bitcoin } from 'lucide-react'
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

const icons: Record<string, any> = {
  'Equities': Building2,
  'Gold': Coins,
  'Crypto': Bitcoin
}

const glows: Record<string, string> = {
  'Equities': 'bg-emerald-500/10',
  'Gold': 'bg-amber-500/10',
  'Crypto': 'bg-blue-500/10'
}

export function PerformanceAttribution({ data }: PerformanceAttributionProps) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {data.map((item) => {
        const Icon = icons[item.name] || Building2;
        const glowClass = glows[item.name] || 'bg-slate-500/10';
        
        return (
          <Card key={item.name} className="glass-premium hover-lift relative overflow-hidden transition-all duration-300 border-white/5">
            {/* Subtle Glow */}
            <div className={cn("absolute -right-4 -top-4 h-24 w-24 rounded-full blur-3xl", glowClass)} />
            
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">
                    {item.name} Performance
                  </h3>
                  <div className={cn(
                    "text-3xl font-black tracking-tight tabular-nums",
                    item.roi >= 0 ? "text-emerald-400 glow-emerald" : "text-rose-400"
                  )}>
                    {item.roi > 0 ? "+" : ""}{formatPercentage(item.roi)}
                  </div>
                </div>
                <div className="rounded-xl bg-white/5 p-2.5">
                  <Icon className="h-5 w-5 text-slate-400" />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Current Exposure
                  </span>
                  <span className="text-sm font-bold text-white tabular-nums">
                    {formatCurrency(item.marketValue)}
                  </span>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Net Invested
                  </span>
                  <span className="text-xs font-bold text-slate-400 tabular-nums">
                    {formatCurrency(item.netInvested)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
