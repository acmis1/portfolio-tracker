'use client'

import { RebalanceNode } from "@/lib/math/rebalance";
import { formatAssetClass } from "@/lib/formatters";
import { formatVND } from "@/lib/utils/format";
import { ArrowRight, TrendingUp, TrendingDown, Target, ShieldAlert, Sparkles, Plus, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfigureTargetsModal } from "./configure-targets-modal";
import { useTransition } from "react";

interface DriftTableProps {
  nodes: RebalanceNode[];
  initialTargets: any[];
}

export function DriftTable({ nodes, initialTargets }: DriftTableProps) {
  const totalAllocated = initialTargets.reduce((sum, t) => sum + (t.targetWeight || 0), 0);
  const isSetupIncomplete = Math.abs(totalAllocated - 100) > 0.01;
  const isBrandNew = totalAllocated === 0;

  return (
    <div className="space-y-6">
      {/* 1. Onboarding / Strategy Integrity Header */}
      <div className={cn(
        "glass-premium rounded-2xl border p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all duration-500",
        isSetupIncomplete ? "border-amber-500/20 bg-amber-500/5 shadow-[0_0_30px_rgba(245,158,11,0.05)]" : "border-white/5"
      )}>
        <div className="flex items-center gap-4">
          <div className={cn(
            "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg",
            isSetupIncomplete ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"
          )}>
            {isSetupIncomplete ? <ShieldAlert className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-white uppercase tracking-wider text-sm">
                {isBrandNew ? "Strategy Setup Required" : isSetupIncomplete ? "Strategy Imbalance Detected" : "Strategy Verified"}
              </h3>
              {isSetupIncomplete && (
                <span className="animate-pulse flex h-2 w-2 rounded-full bg-amber-500" />
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {isBrandNew 
                ? "You haven't defined any target weights. Set up your allocation strategy to enable drift analysis." 
                : isSetupIncomplete 
                  ? `Your current allocation targets sum to ${totalAllocated.toFixed(2)}%. Strategy must sum to exactly 100.00%.` 
                  : "All target allocations are verified and total 100%. Drift analysis is live and accurate."}
            </p>
          </div>
        </div>
        
        <div className="flex shrink-0">
          <ConfigureTargetsModal initialTargets={initialTargets} />
        </div>
      </div>

      {isBrandNew ? (
        <div className="glass-premium rounded-2xl p-16 text-center border border-dashed border-white/10">
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 rounded-full bg-slate-900 flex items-center justify-center border border-white/5 relative">
              <Sparkles className="h-10 w-10 text-slate-700" />
              <div className="absolute -top-1 -right-1 bg-emerald-500 h-6 w-6 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                <Plus className="h-3 w-3 text-slate-950" />
              </div>
            </div>
          </div>
          <h3 className="text-xl font-black text-white mb-3">Initialize Your Portfolio Strategy</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto mb-8">
            Define target percentages for your asset classes to let Aegis Ledger guide your future trades and rebalancing decisions.
          </p>
          <div className="inline-block">
            <ConfigureTargetsModal initialTargets={initialTargets} />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="glass-premium overflow-hidden rounded-2xl border border-white/5 shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5">
                    <th className="px-6 py-4 font-black uppercase tracking-wider text-slate-400">Asset Cluster</th>
                    <th className="px-6 py-4 text-right font-black uppercase tracking-wider text-slate-400">Weight Drift</th>
                    <th className="px-6 py-4 text-right font-black uppercase tracking-wider text-slate-400">Action Required</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {nodes.map((node) => (
                    <DriftRow key={node.key} node={node} />
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="bg-white/2 px-6 py-5 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  Real-Time Portfolio Drift Engine
                </span>
              </div>
              <div className="flex gap-8">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Total Actual</span>
                  <span className="text-sm font-bold text-white tabular-nums">
                    {formatVND(nodes.reduce((sum, n) => sum + n.currentValue, 0))}
                  </span>
                </div>
                <div className="flex flex-col items-end border-l border-white/5 pl-8">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Total Target</span>
                  <span className="text-sm font-bold text-white tabular-nums">
                    {formatVND(nodes.reduce((sum, n) => sum + n.targetValue, 0))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DriftRow({ node }: { node: RebalanceNode }) {
  const [isPending] = useTransition();
  const [type] = node.key.split(':');
  const isAligned = node.action === 'HOLD';
  const isUnmanaged = type === 'UNMANAGED';
  
  return (
    <tr className={cn(
      "hover:bg-white/5 transition-colors group",
      isUnmanaged && "bg-red-500/5 hover:bg-red-500/10",
      isPending && "opacity-50 pointer-events-none"
    )}>
      {/* Asset Info */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white tracking-tight text-base">
                {node.name}
              </span>
              {type === 'CLASS' && (
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 font-black uppercase tracking-widest">
                  Bucket
                </span>
              )}
              {isUnmanaged && (
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 font-black uppercase tracking-widest">
                  Unmanaged
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-1">
              <div className="flex items-center gap-1">
                <Target className="h-3 w-3 text-slate-600" />
                Target: <span className="text-slate-300 font-bold">{formatVND(node.targetValue)}</span>
              </div>
              <div className="h-1 w-1 rounded-full bg-slate-800" />
              <div className="flex items-center gap-1">
                Actual: <span className="text-slate-300 font-bold">{formatVND(node.currentValue)}</span>
              </div>
            </div>
          </div>
        </div>
      </td>

      {/* Weight Drift */}
      <td className="px-6 py-4 text-right">
        <div className={cn(
          "flex items-center justify-end gap-1 font-black tabular-nums text-sm",
          node.deltaCash < 0 ? 'text-red-400' : node.deltaCash > 0 ? 'text-emerald-400' : 'text-slate-500'
        )}>
          {node.deltaCash < 0 ? <TrendingDown className="h-4 w-4" /> : node.deltaCash > 0 ? <TrendingUp className="h-4 w-4" /> : null}
          {formatVND(node.deltaCash)}
        </div>
      </td>

      {/* Action Required */}
      <td className="px-6 py-4 text-right">
        {isAligned ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/50 text-slate-500 text-[10px] font-black uppercase tracking-widest border border-white/5">
            <div className="h-1.5 w-1.5 rounded-full bg-slate-600" />
            Neutral
          </div>
        ) : (
          <div className={cn(
            "inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm",
            node.deltaCash > 0 
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
              : "bg-red-500/10 text-red-400 border border-red-500/20"
          )}>
            {node.deltaCash > 0 ? "Buy" : "Sell"}
            <ArrowRight className="h-3 w-3 opacity-50" />
            <span className="tabular-nums">{formatVND(Math.abs(node.deltaCash))}</span>
          </div>
        )}
      </td>
    </tr>
  );
}
