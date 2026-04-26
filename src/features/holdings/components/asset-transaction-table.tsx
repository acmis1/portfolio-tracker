"use client"

import * as React from "react"
import { format } from "date-fns"
import { formatCurrency } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import { EditTransactionModal } from "@/features/transactions/components/edit-transaction-modal"
import { TransactionModal } from "@/features/transactions/components/transaction-modal"
import { AssetConversionModal } from "@/features/transactions/components/asset-conversion-modal"
import { PlusCircle, Trash2, ArrowRightLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { deleteTransaction } from "@/features/transactions/actions"
import { useRouter } from "next/navigation"
import { Transaction } from "@prisma/client"
import { ASSET_CLASSES } from "@/lib/validations"
import { 
  getActivityTypeLabel, 
  getActivityTone 
} from "@/features/transactions/services/display-utils"

export interface AssetTransactionTableProps {
  transactions: Transaction[];
  assetId: string;
  symbol: string;
  assetName: string;
  assetClass: string;
  assetCurrency: string;
  fxRate: number;
}

export function AssetTransactionTable({ 
  transactions, 
  assetId,
  symbol, 
  assetName, 
  assetClass, 
  assetCurrency, 
  fxRate 
}: AssetTransactionTableProps) {
  const isUSD = assetCurrency === 'USD';
  const router = useRouter();
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this transaction? This will also update your cash balance if linked.")) {
      return;
    }

    setIsDeleting(id);
    const result = await deleteTransaction(id);
    setIsDeleting(null);

    if (result.success) {
      router.refresh();
    } else {
      alert(result.error || "Failed to delete transaction");
    }
  };

  // Stable trigger for the "Log Transaction" modal to avoid hydration mismatches
  const addTransactionTrigger = (
    <Button variant="outline" size="sm" className="glass-premium border-white/10 text-slate-400 hover:text-white">
      <PlusCircle className="mr-2 h-4 w-4" /> Log Transaction
    </Button>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
        <div className="flex items-center gap-2">
          <AssetConversionModal 
            initialFromAssetId={assetId}
            trigger={
              <Button variant="outline" size="sm" className="glass-premium border-white/10 text-slate-400 hover:text-white">
                <ArrowRightLeft className="mr-2 h-4 w-4" /> Convert Asset
              </Button>
            }
          />
          <TransactionModal 
            initialSymbol={symbol} 
            initialName={assetName}
            initialAssetClass={assetClass}
            initialCurrency={assetCurrency}
            fxRate={fxRate}
            trigger={addTransactionTrigger}
          />
        </div>
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
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 italic">
                    No transactions recorded for this asset yet.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const theoreticalValueVnd = Math.abs(tx.quantity * tx.pricePerUnit);
                  const actualValueVnd = Math.abs(tx.grossAmount);
                  const derivedFeeVnd = tx.type === 'BUY' 
                    ? actualValueVnd - theoreticalValueVnd 
                    : theoreticalValueVnd - actualValueVnd;
                  const displayFeesVnd = Math.max(0, derivedFeeVnd);
                  
                  const displayPrice = isUSD ? tx.pricePerUnit / fxRate : tx.pricePerUnit;
                  const displayFees = isUSD ? displayFeesVnd / fxRate : displayFeesVnd;
                  const displayTotal = tx.grossAmount;
                  
                  return (
                    <tr key={tx.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 text-slate-300">
                        {format(new Date(tx.date), "dd/MM/yyyy")}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest self-start",
                            getActivityTone(tx.type) === 'positive' ? "bg-emerald-500/10 text-emerald-400" : 
                            getActivityTone(tx.type) === 'negative' ? "bg-red-500/10 text-red-500" : 
                            "bg-slate-800 text-slate-400"
                          )}>
                            {getActivityTypeLabel(tx.type)}
                          </span>
                          {tx.conversionId && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-tighter text-blue-400">
                              <ArrowRightLeft className="h-2 w-2" />
                              Conversion
                            </span>
                          )}
                        </div>
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
                        <div className="flex items-center justify-end gap-1">
                          <EditTransactionModal 
                            transaction={tx} 
                            asset={{
                              symbol: symbol,
                              name: assetName,
                              assetClass: assetClass as typeof ASSET_CLASSES[number],
                              currency: assetCurrency as 'VND' | 'USD'
                            }}
                            fxRate={fxRate}
                          />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-400/10"
                            onClick={() => handleDelete(tx.id)}
                            disabled={isDeleting === tx.id}
                          >
                            <Trash2 className={cn("h-4 w-4", isDeleting === tx.id && "animate-pulse")} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
