import { formatCurrency } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import { USD_VND_RATE } from "@/lib/constants"

interface AssetTransactionTableProps {
  transactions: any[]
  assetCurrency: string
}

export function AssetTransactionTable({ transactions, assetCurrency }: AssetTransactionTableProps) {
  const isUSD = assetCurrency === 'USD';

  return (
    <div className="space-y-4">
      <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Transaction History</h2>
      <div className="glass-premium overflow-hidden rounded-2xl border border-white/5 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-6 py-4 font-black uppercase tracking-wider text-slate-400">Date</th>
                <th className="px-6 py-4 font-black uppercase tracking-wider text-slate-400">Type</th>
                <th className="px-6 py-4 text-right font-black uppercase tracking-wider text-slate-400">Quantity</th>
                <th className="px-6 py-4 text-right font-black uppercase tracking-wider text-slate-400">Price ({assetCurrency})</th>
                <th className="px-6 py-4 text-right font-black uppercase tracking-wider text-slate-400">Fees ({assetCurrency})</th>
                <th className="px-6 py-4 text-right font-black uppercase tracking-wider text-slate-400">Total (VND)</th>
                <th className="px-6 py-4 text-right font-black uppercase tracking-wider text-slate-400">Realized P&L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transactions.map((tx) => {
                const displayPrice = isUSD ? tx.pricePerUnit / USD_VND_RATE : tx.pricePerUnit;
                const displayFees = isUSD ? tx.fees / USD_VND_RATE : tx.fees;
                
                // Total (Gross Amount) is the wealth/cash impact, strictly VND
                const displayTotal = tx.grossAmount;
                const realizedPnL = tx.realizedPnL;
                
                return (
                  <tr key={tx.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 text-slate-300">
                      {new Date(tx.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest",
                        tx.type === 'BUY' ? "bg-emerald-500/10 text-emerald-400" : 
                        tx.type === 'SELL' ? "bg-red-500/10 text-red-500" : 
                        "bg-slate-800 text-slate-400"
                      )}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-300 tabular-nums">
                      {tx.quantity.toLocaleString(undefined, { maximumFractionDigits: 8 })}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-300 tabular-nums">
                      {formatCurrency(displayPrice, assetCurrency)}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-500 tabular-nums">
                      {formatCurrency(displayFees, assetCurrency)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-white tabular-nums">
                      {formatCurrency(displayTotal, 'VND')}
                    </td>
                    <td className={cn(
                      "px-6 py-4 text-right font-bold tabular-nums",
                      realizedPnL > 0 ? "text-emerald-400" : realizedPnL < 0 ? "text-red-400" : "text-slate-500"
                    )}>
                      {realizedPnL != null ? formatCurrency(realizedPnL, 'VND') : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
