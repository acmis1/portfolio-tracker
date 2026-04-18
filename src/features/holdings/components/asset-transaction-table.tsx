import { formatCurrency } from "@/lib/formatters"
import { cn } from "@/lib/utils"

interface AssetTransactionTableProps {
  transactions: any[]
  assetCurrency: string
}

export function AssetTransactionTable({ transactions, assetCurrency }: AssetTransactionTableProps) {
  const rate = 25400;
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
                <th className="px-6 py-4 text-right font-black uppercase tracking-wider text-slate-400">Price</th>
                <th className="px-6 py-4 text-right font-black uppercase tracking-wider text-slate-400">Fees</th>
                <th className="px-6 py-4 text-right font-black uppercase tracking-wider text-slate-400">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transactions.map((tx) => {
                const displayPrice = isUSD ? tx.pricePerUnit / rate : tx.pricePerUnit;
                const displayFees = isUSD ? tx.fees / rate : tx.fees;
                const displayTotal = isUSD ? tx.grossAmount / rate : tx.grossAmount;
                
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
                      {formatCurrency(displayTotal, assetCurrency)}
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
