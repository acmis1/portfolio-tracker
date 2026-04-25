import { formatVND, formatAssetDisplay } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import { Activity, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface RecentActivityProps {
  activities: any[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  // Show last 5
  const recent = activities.slice(0, 5);

  const isInflow = (type: string) => {
    return ['DEPOSIT', 'DIVIDEND', 'INTEREST', 'SELL'].includes(type)
  }

  return (
    <div className="glass-premium rounded-2xl overflow-hidden border border-white/5 shadow-xl flex flex-col h-full">
      <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between shrink-0">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Recent Activity</h3>
         <Activity className="h-3 w-3 text-slate-500" />
      </div>
      
      <div className="flex-1 divide-y divide-white/5">
        {recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-6 space-y-2">
            <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center">
               <Activity className="h-4 w-4 text-slate-600" />
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">No recent activity</p>
          </div>
        ) : (
          recent.map((tx: any) => {
            const { primary, secondary } = tx.assetSymbol 
              ? formatAssetDisplay(tx.assetSymbol, tx.assetName || '') 
              : { primary: tx.description || tx.type.replace('_', ' '), secondary: undefined };

            return (
              <div key={tx.id} className="p-3 px-5 flex items-center justify-between hover:bg-white/5 transition-colors group">
                 <div className="flex flex-col min-w-0">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                      {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-xs font-black text-slate-200 truncate pr-2">
                      {primary}
                    </span>
                    {secondary && (
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter truncate max-w-[140px]">
                        {secondary}
                      </span>
                    )}
                 </div>
               <div className="flex flex-col items-end shrink-0">
                  <span className={cn(
                    "text-xs font-black tabular-nums transition-transform group-hover:scale-105",
                    isInflow(tx.type) ? "text-emerald-400" : "text-slate-400"
                  )}>
                    {isInflow(tx.type) ? '+' : '-'} {formatVND(Math.abs(tx.amount))}
                  </span>
                  <span className="text-[9px] text-slate-500 italic truncate max-w-[120px]">
                    {tx.category === 'ASSET' ? `${tx.type} ${tx.quantity} units` : (tx.description || 'No description')}
                  </span>
               </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-3 border-t border-white/5 bg-white/5 shrink-0">
        <Link 
          href="/ledger" 
          className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
        >
          View Full Ledger
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  )
}
