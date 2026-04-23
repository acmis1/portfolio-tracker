'use client'

import { RebalanceNode } from "@/lib/math/rebalance";
import { formatPercentage, formatAssetClass } from "@/lib/formatters";
import { formatVND } from "@/lib/utils/format";
import { ArrowRight, TrendingUp, TrendingDown, Target, HelpCircle, Trash2, ShieldX } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ConfigureTargetsModal } from "./configure-targets-modal";
import { deleteTargetAllocation } from "../actions/allocations";
import { useTransition } from "react";

interface DriftTableProps {
  nodes: RebalanceNode[];
  initialTargets: any[];
}

export function DriftTable({ nodes, initialTargets }: DriftTableProps) {
  const totalAllocated = initialTargets.reduce((sum, t) => sum + (t.targetWeight || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Strategy Integrity</span>
            <div className={cn(
              "flex items-center gap-2 text-sm font-bold",
              Math.abs(totalAllocated - 100) < 0.01 ? "text-emerald-400" : "text-amber-400"
            )} title="Total allocated weight should sum to 100%">
              {Math.abs(totalAllocated - 100) < 0.01 ? (
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              ) : (
                <ShieldX className="h-4 w-4" />
              )}
              {totalAllocated.toFixed(2)}% / 100.00% Allocated
            </div>
          </div>
        </div>
        <ConfigureTargetsModal initialTargets={initialTargets} />
      </div>

      <div className="glass-premium overflow-hidden rounded-2xl border border-white/5 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-6 py-4 font-black uppercase tracking-wider text-slate-400">Asset</th>
                <th className="px-6 py-4 text-right font-black uppercase tracking-wider text-slate-400">Weight Drift</th>
                <th className="px-6 py-4 text-right font-black uppercase tracking-wider text-slate-400">Cash Requirement (VND)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {nodes.map((node) => (
                <DriftRow key={node.key} node={node} />
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="bg-white/5 px-6 py-4 border-t border-white/5 flex justify-between items-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Engine Summary
          </span>
          <div className="flex gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Total Holdings</span>
              <span className="text-sm font-bold text-white tabular-nums">
                {formatVND(nodes.reduce((sum, n) => sum + n.currentValue, 0))}
              </span>
            </div>
            <div className="flex flex-col items-end border-l border-white/5 pl-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Total Target</span>
              <span className="text-sm font-bold text-white tabular-nums">
                {formatVND(nodes.reduce((sum, n) => sum + n.targetValue, 0))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DriftRow({ node }: { node: RebalanceNode }) {
  const [isPending, startTransition] = useTransition();
  const [type, key] = node.key.split(':');
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
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white tracking-tight">
                {node.name}
              </span>
              {type === 'CLASS' && (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 font-black uppercase tracking-widest">
                  Bucket
                </span>
              )}
              {isUnmanaged && (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 font-black uppercase tracking-widest">
                  Unmanaged
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Target className="h-3 w-3" />
              Target: {formatVND(node.targetValue)}
              <span className="text-slate-700 mx-1">/</span>
              Actual: {formatVND(node.currentValue)}
            </div>
          </div>
        </div>
      </td>

      {/* Weight Drift */}
      <td className="px-6 py-4 text-right">
        <div className={cn(
          "flex items-center justify-end gap-1 font-black tabular-nums",
          node.deltaCash < 0 ? 'text-red-400' : node.deltaCash > 0 ? 'text-emerald-400' : 'text-slate-500'
        )}>
          {node.deltaCash < 0 ? <TrendingDown className="h-3 w-3" /> : node.deltaCash > 0 ? <TrendingUp className="h-3 w-3" /> : null}
          {formatVND(node.deltaCash)}
        </div>
      </td>

      {/* Cash Requirement (VND) */}
      <td className="px-6 py-4 text-right font-black tabular-nums">
        {isAligned ? (
          <span className="text-slate-600 font-medium italic">—</span>
        ) : (
          <span className={cn(
            node.deltaCash > 0 ? "text-emerald-400" : "text-rose-400"
          )}>
            {node.deltaCash > 0 ? "+" : ""}{formatVND(node.deltaCash)}
          </span>
        )}
      </td>
    </tr>
  );
}
