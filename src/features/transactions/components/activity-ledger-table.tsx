'use client'

import { useState, useMemo } from 'react'
import { formatVND, formatAssetDisplay } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import { EditCashModal } from './edit-cash-modal'
import { Search, Filter, ArrowUpRight, ArrowDownLeft, Wallet, Landmark, TrendingUp, CircleDollarSign, ArrowRightLeft, Tag } from 'lucide-react'
import { ImportWizard } from '@/features/import/components/import-wizard'
import { Select } from '@/components/ui/select'
import { UnifiedActivity } from '@/features/transactions/queries'
import { 
  getSignedAmountDisplay, 
  getActivityTypeLabel,
  getConversionLabel,
  isInflowActivity
} from '../services/display-utils'

interface ActivityLedgerTableProps {
  activities: UnifiedActivity[];
}

const TYPE_FILTERS = [
  { label: 'All Activities', value: 'ALL', types: [] },
  { label: 'Trades', value: 'TRADES', types: ['BUY', 'SELL'] },
  { label: 'Cash Movement', value: 'CASH', types: ['DEPOSIT', 'WITHDRAWAL'] },
  { label: 'Income', value: 'INCOME', types: ['DIVIDEND', 'INTEREST'] },
  { label: 'Internal Movement', value: 'INTERNAL', types: ['CONVERSION'] },
  { label: 'Buy', value: 'BUY', types: ['BUY'] },
  { label: 'Sell', value: 'SELL', types: ['SELL'] },
  { label: 'Deposit', value: 'DEPOSIT', types: ['DEPOSIT'] },
  { label: 'Withdrawal', value: 'WITHDRAWAL', types: ['WITHDRAWAL'] },
  { label: 'Dividend', value: 'DIVIDEND', types: ['DIVIDEND'] },
  { label: 'Interest', value: 'INTEREST', types: ['INTEREST'] },
  { label: 'Conversion', value: 'CONVERSION', types: ['CONVERSION'] },
]

export function ActivityLedgerTable({ activities }: ActivityLedgerTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [activeAsset, setActiveAsset] = useState('ALL')

  const uniqueAssets = useMemo(() => {
    const symbols = new Set<string>();
    activities.forEach(tx => {
      if (tx.assetSymbol) symbols.add(tx.assetSymbol);
    });
    return Array.from(symbols).sort();
  }, [activities]);

  const filteredTransactions = useMemo(() => {
    const filterGroup = TYPE_FILTERS.find(f => f.value === activeFilter);
    const allowedTypes = filterGroup?.types || [];

    return activities.filter(tx => {
      const { primary, secondary } = tx.assetSymbol ? formatAssetDisplay(tx.assetSymbol, tx.assetName || '') : { primary: '', secondary: '' };
      
      const matchesSearch = 
        tx.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        primary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (secondary?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        tx.type?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = activeFilter === 'ALL' || allowedTypes.includes(tx.type);
      const matchesAsset = activeAsset === 'ALL' || tx.assetSymbol === activeAsset;
      
      return matchesSearch && matchesType && matchesAsset;
    })
  }, [activities, searchQuery, activeFilter, activeAsset])

  if (activities.length === 0) {
    return (
      <div className="glass-premium rounded-2xl p-12 text-center">
        <p className="text-sm text-slate-500 font-medium">No activity recorded in the ledger</p>
      </div>
    )
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT': return <ArrowDownLeft className="h-3 w-3 text-emerald-400" />
      case 'WITHDRAWAL': return <ArrowUpRight className="h-3 w-3 text-rose-400" />
      case 'BUY': return <CircleDollarSign className="h-3 w-3 text-blue-400" />
      case 'SELL': return <TrendingUp className="h-3 w-3 text-emerald-400" />
      case 'DIVIDEND': return <Wallet className="h-3 w-3 text-amber-400" />
      case 'INTEREST': return <Landmark className="h-3 w-3 text-indigo-400" />
      case 'CONVERSION': return <ArrowRightLeft className="h-3 w-3 text-blue-400" />
      default: return null
    }
  }


  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="flex flex-col xl:flex-row gap-3 items-stretch xl:items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/5">
        <div className="flex flex-col md:flex-row gap-3 flex-1">
          <div className="relative flex-1 group min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
            <input
              type="text"
              placeholder="Search activity..."
              className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <div className="relative w-full md:w-48">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
              <Select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                className="pl-9"
              >
                {TYPE_FILTERS.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </Select>
            </div>

            <div className="relative w-full md:w-48">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
              <Select
                value={activeAsset}
                onChange={(e) => setActiveAsset(e.target.value)}
                className="pl-9"
              >
                <option value="ALL">All Assets</option>
                {uniqueAssets.map(asset => (
                  <option key={asset} value={asset}>{asset}</option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <ImportWizard />
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
                filteredTransactions.map((tx: UnifiedActivity) => {
                  const isAssetTx = tx.category === 'ASSET';
                  const isConversion = tx.category === 'CONVERSION';

                  return (
                    <tr key={tx.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 text-[11px] font-medium text-slate-400 tabular-nums">
                        {new Date(tx.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "p-1.5 rounded-lg",
                            isConversion ? "bg-blue-500/10" :
                            isInflowActivity(tx.type) ? "bg-emerald-500/10" : "bg-rose-500/10"
                          )}>
                            {getTypeIcon(tx.type)}
                          </div>
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-widest",
                            isConversion ? "text-blue-400" :
                            isAssetTx ? "text-blue-400" : "text-slate-400"
                          )}>
                            {getActivityTypeLabel(tx.type)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          {isConversion ? (
                            <>
                              <span className="text-xs font-black text-slate-200">
                                {getConversionLabel({ fromSymbol: tx.fromAssetSymbol, toSymbol: tx.toAssetSymbol })}
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium">
                                Internal Conversion
                              </span>
                            </>
                          ) : tx.assetSymbol ? (() => {
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
                              {tx.description || getActivityTypeLabel(tx.type)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isConversion ? (
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400">
                              {tx.fromQuantity?.toLocaleString()} {tx.fromAssetSymbol} → {tx.toQuantity?.toLocaleString()} {tx.toAssetSymbol}
                            </span>
                            {tx.metadata?.venue && (
                              <span className="text-[10px] text-slate-500">
                                Venue: {tx.metadata.venue}
                              </span>
                            )}
                          </div>
                        ) : isAssetTx ? (
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400">
                              {(tx.quantity ?? 0) > 0 ? `${tx.quantity?.toLocaleString()} units` : '-'}
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
                        isConversion ? "text-slate-400" :
                        isInflowActivity(tx.type) ? "text-emerald-400" : "text-slate-300"
                      )}>
                        {isConversion ? (
                          <span className="text-[10px] text-slate-500 italic">Neutral</span>
                        ) : (() => {
                          const { text } = getSignedAmountDisplay({ type: tx.type, amount: tx.amount });
                          return text;
                        })()}
                        {isConversion && tx.price && (
                          <div className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter">
                            {formatVND(tx.price)} basis
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                        {!isAssetTx && !isConversion && <EditCashModal transaction={tx} />}
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
      <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex flex-col md:flex-row gap-3">
        <div className="h-10 flex-1 bg-white/5 rounded-xl" />
        <div className="h-10 w-48 bg-white/5 rounded-xl" />
        <div className="h-10 w-48 bg-white/5 rounded-xl" />
        <div className="h-10 w-32 bg-white/5 rounded-xl" />
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
