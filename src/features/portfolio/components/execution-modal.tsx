"use client"

import * as React from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AssetDrift } from "../types"
import { executeRebalancePlan } from "../actions/rebalancing"
import { formatCurrency, formatNumber } from "@/lib/formatters"
import { Loader2, TrendingUp, TrendingDown, AlertCircle, CheckCircle2 } from "lucide-react"

interface ExecutionModalProps {
  drifts: AssetDrift[]
  cashBalance: number
}

export function ExecutionModal({ drifts, cashBalance }: ExecutionModalProps) {
  const [open, setOpen] = React.useState(false)
  const [isSettling, setIsSettling] = React.useState(false)
  
  const actionableTrades = drifts.filter(d => Math.abs(d.actionAmount) >= 1000)
  const totalBuyAmount = actionableTrades
    .filter(d => d.actionAmount > 0)
    .reduce((acc, d) => acc + d.actionAmount, 0)
  
  const totalSellAmount = actionableTrades
    .filter(d => d.actionAmount < 0)
    .reduce((acc, d) => acc + Math.abs(d.actionAmount), 0)
  
  const isCashInsufficient = totalBuyAmount > cashBalance

  async function handleSettle() {
    setIsSettling(true)
    try {
      const result = await executeRebalancePlan(drifts)
      if (result.success) {
        setOpen(false)
      } else {
        alert(result.error || "Execution failed")
      }
    } catch (error) {
      console.error(error)
      alert("An unexpected error occurred during settlement")
    } finally {
      setIsSettling(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="premium" className="w-full sm:w-auto">
          Generate Execution Plan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] glass-premium border-white/10 max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            Execution Plan Settlement
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-2">
          {actionableTrades.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500/50 mb-4" />
              <p>Portfolio is perfectly balanced. No trades required.</p>
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                  <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold mb-1">Total Sells (Inflow)</p>
                  <p className="text-lg font-mono text-emerald-50">{formatCurrency(totalSellAmount)}</p>
                </div>
                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                  <p className="text-[10px] uppercase tracking-wider text-amber-400 font-bold mb-1">Total Buys (Outflow)</p>
                  <p className="text-lg font-mono text-amber-50">{formatCurrency(totalBuyAmount)}</p>
                </div>
              </div>

              {/* Trade List */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 px-1">Planned Transactions</h3>
                <div className="space-y-2">
                  {actionableTrades.map(trade => {
                    const isBuy = trade.actionAmount > 0
                    return (
                      <div 
                        key={trade.assetId} 
                        className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-md ${isBuy ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                            {isBuy ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{trade.symbol}</p>
                            <p className="text-[10px] text-zinc-400">{isBuy ? 'Buy' : 'Sell'} @ {formatCurrency(trade.currentPrice)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-mono font-bold ${isBuy ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isBuy ? '+' : '-'}{formatNumber(Math.abs(trade.actionAmount / trade.currentPrice), 4)} units
                          </p>
                          <p className="text-[10px] text-zinc-500">{formatCurrency(Math.abs(trade.actionAmount))}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Cash Warning */}
              {isCashInsufficient && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-200">Insufficient Cash</p>
                    <p className="text-xs text-red-400/80 mt-1">
                      Total BUY amount ({formatCurrency(totalBuyAmount)}) exceeds current cash balance ({formatCurrency(cashBalance)}). 
                      Ensure you have enough liquidity in your real brokerage accounts before settling.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="pt-4 border-t border-white/5">
          <Button 
            variant="ghost" 
            onClick={() => setOpen(false)}
            className="text-zinc-400 hover:text-white"
          >
            Cancel
          </Button>
          <Button 
            variant="premium" 
            disabled={actionableTrades.length === 0 || isSettling}
            onClick={handleSettle}
            className="min-w-[140px]"
          >
            {isSettling ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Settling...
              </>
            ) : (
              "Settle Trades"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
