import { getCashTransactions } from '../actions'
import { formatCurrency } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { EditCashModal } from './edit-cash-modal'

export async function CashLedgerTable() {
  const transactions = await getCashTransactions()

  if (transactions.length === 0) {
    return (
      <div className="glass-premium rounded-2xl p-12 text-center">
        <p className="text-sm text-slate-500 font-medium">No cash transactions recorded</p>
      </div>
    )
  }

  const isInflow = (type: string) => {
    return ['DEPOSIT', 'DIVIDEND', 'INTEREST', 'SELL_ASSET'].includes(type)
  }

  return (
    <div className="glass-premium overflow-hidden rounded-2xl border border-white/5 shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/5 bg-white/5">
              <th className="px-6 py-4 font-black uppercase tracking-wider text-slate-400">Date</th>
              <th className="px-6 py-4 font-black uppercase tracking-wider text-slate-400">Type</th>
              <th className="px-6 py-4 font-black uppercase tracking-wider text-slate-400">Description</th>
              <th className="px-6 py-4 text-right font-black uppercase tracking-wider text-slate-400">Amount</th>
              <th className="px-6 py-4 text-right font-black uppercase tracking-wider text-slate-400"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {transactions.map((tx: any) => (
              <tr key={tx.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-6 py-4 text-xs font-medium text-slate-300">
                  {new Date(tx.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {tx.type.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-slate-400 italic">
                  {tx.description || '-'}
                </td>
                <td className={cn(
                  "px-6 py-4 text-right text-xs font-black tabular-nums",
                  isInflow(tx.type) ? "text-emerald-400" : "text-slate-400"
                )}>
                  {isInflow(tx.type) ? '+' : '-'} {formatCurrency(tx.amount)}
                </td>
                <td className="px-6 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                  <EditCashModal transaction={tx} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
