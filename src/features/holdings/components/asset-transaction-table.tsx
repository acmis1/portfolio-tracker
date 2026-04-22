import { formatCurrency } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import { EditTransactionModal } from "@/features/transactions/components/edit-transaction-modal"
import { TransactionModal } from "@/features/transactions/components/transaction-modal"
import { PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AssetTransactionTableProps {
  transactions: any[]
  symbol: string
  assetName: string
  assetClass: string
  assetCurrency: string
  fxRate: number
}

export function AssetTransactionTable({ transactions, symbol, assetName, assetClass, assetCurrency, fxRate }: AssetTransactionTableProps) {
  const isUSD = assetCurrency === 'USD';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Transaction History</h2>
        <TransactionModal 
          initialSymbol={symbol}
          initialName={assetName}
          initialAssetClass={assetClass}
          initialCurrency={assetCurrency}
          fxRate={fxRate}
          trigger={
            <Button variant="outline" size="sm" className="glass-premium border-white/10 text-slate-400 hover:text-white">
              <PlusCircle className="mr-2 h-4 w-4" /> Log Transaction
            </Button>
          }
        />
      </div>
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
                <th className="px-6 py-4 text-right font-black uppercase tracking-wider text-slate-400"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transactions.map((tx: any) => {
                // Late-stage presentation conversion using dynamic fxRate
                // Derived Fees: Difference between cash impact and asset value
                const theoreticalValueVnd = Math.abs(tx.quantity * tx.pricePerUnit);
                const actualValueVnd = Math.abs(tx.grossAmount);
                const derivedFeeVnd = tx.type === 'BUY' 
                  ? actualValueVnd - theoreticalValueVnd 
                  : theoreticalValueVnd - actualValueVnd;
                const displayFeesVnd = Math.max(0, derivedFeeVnd);
                
                const displayPrice = isUSD ? tx.pricePerUnit / fxRate : tx.pricePerUnit;
                const displayFees = isUSD ? displayFeesVnd / fxRate : displayFeesVnd;
                
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
                    <td className="px-6 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                       <EditTransactionModal 
                         transaction={tx} 
                         asset={{
                           symbol,
                           name: assetName,
                           assetClass: assetClass as any,
                           currency: assetCurrency as any
                         }}
                         fxRate={fxRate}
                       />
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
