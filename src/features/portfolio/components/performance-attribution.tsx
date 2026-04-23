import { Building2, Layers, Bitcoin } from 'lucide-react'
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card'
import { formatCurrency, formatPercentage } from '@/lib/formatters'
import { formatVND } from '@/lib/utils/format'
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
  'Gold': Layers,
  'Crypto': Bitcoin
}

const glows: Record<string, string> = {
  'Equities': 'bg-emerald-500/10',
  'Gold': 'bg-amber-500/10',
  'Crypto': 'bg-blue-500/10'
}

export function PerformanceAttribution({ data }: PerformanceAttributionProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {data.map((item) => {
        const Icon = icons[item.name] || Building2;
        const glowClass = glows[item.name] || 'bg-slate-500/10';
        
        return (
          <Card key={item.name} className="glass-premium hover-lift relative overflow-hidden transition-all duration-300 border-white/5">
            {/* Subtle Glow */}
            <div className={cn("absolute -right-4 -top-4 h-24 w-24 rounded-full blur-3xl", glowClass)} />
            
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-slate-400 font-medium tracking-wide uppercase text-xs">
                  {item.name} Performance
                </CardDescription>
                <Icon className="h-4 w-4 text-slate-500/50" />
              </div>
            </CardHeader>

            <CardContent>
              <div className={cn(
                "mb-4 text-2xl font-bold tracking-tight tabular-nums",
                item.roi > 0 ? "text-emerald-500" : item.roi < 0 ? "text-rose-500" : "text-white"
              )}>
                {formatPercentage(item.roi)}
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-500 uppercase tracking-widest">
                    Exposure
                  </span>
                  <span className="font-bold text-white tabular-nums">
                    {formatVND(item.marketValue)}
                  </span>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-500 uppercase tracking-widest">
                    Cost Basis
                  </span>
                  <span className="font-bold text-slate-400 tabular-nums">
                    {formatVND(item.netInvested)}
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
