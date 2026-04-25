'use client'

import { useState, useMemo } from 'react'
import { formatVND, formatAssetDisplay } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import { EditCashModal } from './edit-cash-modal'
import { Search, Filter, ArrowUpRight, ArrowDownLeft, Wallet, Landmark, TrendingUp, CircleDollarSign } from 'lucide-react'
import { ImportWizard } from '@/features/import/components/import-wizard'

interface ActivityLedgerTableProps {
  activities: any[];
}

type TxType = 'ALL' | 'DEPOSIT' | 'WITHDRAWAL' | 'BUY' | 'SELL' | 'DIVIDEND' | 'INTEREST';

export function ActivityLedgerTable({ activities }: ActivityLedgerTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeType, setActiveType] = useState<TxType>('ALL')

  const filteredTransactions = useMemo(() => {
    return activities.filter(tx => {
      const { primary, secondary } = tx.assetSymbol ? formatAssetDisplay(tx.assetSymbol, tx.assetName || '') : { primary: '', secondary: '' };
      
      const matchesSearch = 
        tx.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        primary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (secondary?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        tx.type?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = activeType === 'ALL' || tx.type === activeType;
      
      return matchesSearch && matchesType;
    })
  }, [activities, searchQuery, activeType])

  if (activities.length === 0) {
    return (
      <div className="glass-premium rounded-2xl p-12 text-center">
        <p className="text-sm text-slate-500 font-medium">No activity recorded in the ledger</p>
      </div>
    )
  }

  const isInflow = (type: string) => {
    return ['DEPOSIT', 'DIVIDEND', 'INTEREST', 'SELL'].includes(type)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT': return <ArrowDownLeft className="h-3 w-3 text-emerald-400" />
      case 'WITHDRAWAL': return <ArrowUpRight className="h-3 w-3 text-rose-400" />
      case 'BUY': return <CircleDollarSign className="h-3 w-3 text-blue-400" />
      case 'SELL': return <TrendingUp className="h-3 w-3 text-emerald-400" />
      case 'DIVIDEND': return <Wallet className="h-3 w-3 text-amber-400" />
      case 'INTEREST': return <Landmark className="h-3 w-3 text-indigo-400" />
      default: return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96 flex gap-2">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
            <input
              type="text"
              placeholder="Search assets, activities, descriptions..."
              className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <ImportWizard />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
          {(['ALL', 'DEPOSIT', 'WITHDRAWAL', 'BUY', 'SELL', 'DIVIDEND', 'INTEREST'] as TxType[]).map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={cn(
                "whitespace-nowrap px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border",
                activeType === type
                  ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                  : "bg-slate-900/50 border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/10"
              )}
            >
              {type.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-premium overflow-hidden rounded-2xl border border-white/5 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-6 py-4 font-black uppercase tracking-wider text-slate-400 text-[10px]">Date</th>
                <th className="px-6 py-4 font-black uppercase tracking-wider text-slate-400 text-[10px]">Type</th>
                <th className="px-6 py-4 font-black uppercase tracking-wider text-slate-400 text-[10px]">Activity / Asset</th>
                <th className="px-6 py-4 font-black uppercase tracking-wider text-slate-400 text-[10px]">Details</th>
                <th className="px-6 py-4 text-right font-black uppercase tracking-wider text-slate-400 text-[10px]">Amount</th>
                <th className="px-6 py-4 text-right font-black uppercase tracking-wider text-slate-400 text-[10px]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx: any) => {
                  const isAssetTx = tx.category === 'ASSET';

                  return (
                    <tr key={tx.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 text-[11px] font-medium text-slate-400 tabular-nums">
                        {new Date(tx.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "p-1.5 rounded-lg",
                            isInflow(tx.type) ? "bg-emerald-500/10" : "bg-rose-500/10"
                          )}>
                            {getTypeIcon(tx.type)}
                          </div>
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-widest",
                            isAssetTx ? "text-blue-400" : "text-slate-400"
                          )}>
                            {tx.type.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          {tx.assetSymbol ? (() => {
                            const { primary, secondary } = formatAssetDisplay(tx.assetSymbol, tx.assetName || '');
                            return (
                              <>
                                <span className="text-xs font-black text-slate-200">{primary}</span>
                                {secondary && (
                                  <span className="text-[10px] text-slate-500 font-medium truncate max-w-[200px]">
                                    {secondary}
                                  </span>
                                )}
                              </>
                            );
                          })() : (
                            <span className="text-xs font-black text-slate-200">
                              {tx.description || tx.type.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isAssetTx ? (
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400">
                              {tx.quantity > 0 ? `${tx.quantity.toLocaleString()} units` : '-'}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              @ {formatVND(tx.price)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic max-w-[200px] truncate block">
                            {tx.description || (tx.referenceId ? `Ref: ${tx.referenceId}` : 'Cash operation')}
                          </span>
                        )}
                      </td>
                      <td className={cn(
                        "px-6 py-4 text-right text-xs font-black tabular-nums",
                        isInflow(tx.type) ? "text-emerald-400" : "text-slate-300"
                      )}>
                        {isInflow(tx.type) ? '+' : '-'} {formatVND(Math.abs(tx.amount))}
                      </td>
                      <td className="px-6 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                        {tx.category !== 'ASSET' && <EditCashModal transaction={tx} />}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 text-sm">
                    No transactions match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
export function ActivityLedgerSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="h-10 w-full md:w-96 bg-white/5 rounded-xl border border-white/5" />
        <div className="flex gap-2 w-full md:w-auto">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-7 w-20 bg-white/5 rounded-lg" />
          ))}
        </div>
      </div>
      <div className="glass-premium rounded-2xl border border-white/5 overflow-hidden">
        <div className="border-b border-white/5 bg-white/5 p-4">
          <div className="grid grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-3 bg-white/10 rounded" />)}
          </div>
        </div>
        <div className="p-4 space-y-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="grid grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map(j => <div key={j} className="h-4 bg-white/5 rounded" />)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
