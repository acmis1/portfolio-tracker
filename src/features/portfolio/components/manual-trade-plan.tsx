'use client'

import { RebalanceNode } from "@/lib/math/rebalance"
import { formatVND } from "@/lib/utils/format"
import { 
  TrendingDown, 
  TrendingUp, 
  ArrowRight, 
  Copy, 
  Check, 
  ExternalLink,
  Info,
  ArrowDownCircle,
  ArrowUpCircle,
  Link2
} from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ManualTradePlanProps {
  nodes: RebalanceNode[]
  totalAum: number
}

interface TradePair {
  from: string
  to: string
  amount: number
}

export function ManualTradePlan({ nodes, totalAum }: ManualTradePlanProps) {
  const [copied, setCopied] = useState(false)

  // 1. Separate sells and buys
  const sells = nodes
    .filter(n => n.deltaCash < -1000)
    .sort((a, b) => a.deltaCash - b.deltaCash) // Largest negative first

  const buys = nodes
    .filter(n => n.deltaCash > 1000)
    .sort((a, b) => b.deltaCash - a.deltaCash) // Largest positive first

  // 2. Greedy Pairing Logic
  const pairs: TradePair[] = []
  const sellStack = [...sells].map(s => ({ ...s, remaining: Math.abs(s.deltaCash) }))
  const buyStack = [...buys].map(b => ({ ...b, remaining: b.deltaCash }))

  let sIdx = 0
  let bIdx = 0

  while (sIdx < sellStack.length && bIdx < buyStack.length) {
    const sell = sellStack[sIdx]
    const buy = buyStack[bIdx]

    const amount = Math.min(sell.remaining, buy.remaining)
    if (amount > 100) {
      pairs.push({
        from: sell.name,
        to: buy.name,
        amount
      })
    }

    sell.remaining -= amount
    buy.remaining -= amount

    if (sell.remaining < 100) sIdx++
    if (buy.remaining < 100) bIdx++
  }

  const copyToClipboard = () => {
    const text = [
      "=== AEGIS LEDGER: MANUAL REBALANCE PLAN ===",
      `Date: ${new Date().toLocaleDateString()}`,
      "",
      "--- SELL LIST ---",
      ...sells.map(s => `- Sell ${s.name}: ${formatVND(Math.abs(s.deltaCash))}`),
      "",
      "--- BUY LIST ---",
      ...buys.map(b => `- Buy ${b.name}: ${formatVND(b.deltaCash)}`),
      "",
      "--- SUGGESTED FUNDING PATHS ---",
      ...pairs.map(p => `- Move ${formatVND(p.amount)} from ${p.from} to ${p.to}`),
      "",
      "NOTE: Execute these trades manually and log them in the Activity Ledger."
    ].join("\n")

    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (sells.length === 0 && buys.length === 0) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-white px-1">Manual Trade Plan</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={copyToClipboard}
          className="h-8 bg-white/5 border-white/10 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest gap-2"
        >
          {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy Plan"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sell Section */}
        <div className="glass-premium rounded-2xl border border-white/5 overflow-hidden">
          <div className="bg-red-500/10 px-5 py-3 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-400">
              <ArrowDownCircle className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Sells (Overweight)</span>
            </div>
            <span className="text-[10px] font-bold text-slate-500">{sells.length} Assets</span>
          </div>
          <div className="p-4 space-y-3">
            {sells.map(s => (
              <div key={s.key} className="flex items-center justify-between group">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white tracking-tight">{s.name}</span>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">Current Drift: {((s.currentValue / totalAum - s.targetValue / totalAum) * 100).toFixed(1)}%</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-red-400">{formatVND(Math.abs(s.deltaCash))}</div>
                  <div className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">To Liquidate</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Buy Section */}
        <div className="glass-premium rounded-2xl border border-white/5 overflow-hidden">
          <div className="bg-emerald-500/10 px-5 py-3 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400">
              <ArrowUpCircle className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Buys (Underweight)</span>
            </div>
            <span className="text-[10px] font-bold text-slate-500">{buys.length} Assets</span>
          </div>
          <div className="p-4 space-y-3">
            {buys.map(b => (
              <div key={b.key} className="flex items-center justify-between group">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white tracking-tight">{b.name}</span>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">Current Drift: {((b.currentValue / totalAum - b.targetValue / totalAum) * 100).toFixed(1)}%</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-emerald-400">{formatVND(b.deltaCash)}</div>
                  <div className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">To Accumulate</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Suggested Path Section */}
        <div className="glass-premium rounded-2xl border border-white/5 overflow-hidden lg:col-span-1">
          <div className="bg-blue-500/10 px-5 py-3 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-400">
              <Link2 className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Suggested Funding</span>
            </div>
          </div>
          <div className="p-4 space-y-4">
            {pairs.length > 0 ? (
              pairs.map((p, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/2 rounded-xl p-3 border border-white/5">
                  <div className="flex-1">
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter mb-1">From</div>
                    <div className="text-xs font-black text-white truncate">{p.from}</div>
                  </div>
                  <ArrowRight className="h-3 w-3 text-slate-600 shrink-0" />
                  <div className="flex-1">
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter mb-1">To</div>
                    <div className="text-xs font-black text-white truncate">{p.to}</div>
                  </div>
                  <div className="text-right pl-2 border-l border-white/5">
                    <div className="text-xs font-black text-blue-400">{formatVND(p.amount)}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">No funding paths suggested</p>
              </div>
            )}
            
            <div className="mt-4 p-3 rounded-xl bg-slate-900/50 border border-white/5">
              <div className="flex gap-2">
                <Info className="h-3 w-3 text-slate-500 shrink-0 mt-0.5" />
                <p className="text-[9px] text-slate-500 font-medium leading-relaxed">
                  Funding paths are mathematical suggestions to rebalance efficiently. Real-world liquidity, fees, and tax implications should be considered before execution.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
