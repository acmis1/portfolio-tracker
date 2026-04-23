'use client'

import { AssetDrift } from "../types";
import { formatPercentage, formatAssetClass } from "@/lib/formatters";
import { formatVND } from "@/lib/utils/format";
import { ArrowRight, TrendingUp, TrendingDown, Target, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DriftTableProps {
  drifts: AssetDrift[];
}

export function DriftTable({ drifts }: DriftTableProps) {
  return (
    <div className="glass-premium overflow-hidden rounded-2xl border border-white/5 shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/5 bg-white/5">
              <th className="px-6 py-4 font-black uppercase tracking-wider text-slate-400">Asset / Bucket</th>
              <th className="px-6 py-4 text-right font-black uppercase tracking-wider text-slate-400">Weight Drift</th>
              <th className="px-6 py-4 text-center font-black uppercase tracking-wider text-slate-400">Action</th>
              <th className="px-6 py-4 text-right font-black uppercase tracking-wider text-slate-400">Suggested Trade</th>
              <th className="px-6 py-4 text-right font-black uppercase tracking-wider text-slate-400">Cash Req.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {drifts.map((drift) => (
              <DriftRow key={drift.assetId} drift={drift} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DriftRow({ drift }: { drift: AssetDrift }) {
  const isAligned = Math.abs(drift.actionAmount) < 1000;
  const isUnmanaged = drift.type === 'UNMANAGED';

  return (
    <tr className={cn(
      "hover:bg-white/5 transition-colors group",
      isUnmanaged && "bg-red-500/5 hover:bg-red-500/10"
    )}>
      {/* Asset Info */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white tracking-tight">
                {drift.name}
              </span>
              {drift.type === 'CLASS' && (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 font-black uppercase tracking-widest">
                  Class
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
              Target: {formatPercentage(drift.targetWeight, false)}
              <span className="text-slate-700 mx-1">/</span>
              Actual: {formatPercentage(drift.currentWeight, false)}
            </div>
          </div>
        </div>
      </td>

      {/* Drift */}
      <td className="px-6 py-4 text-right">
        <div className={cn(
          "flex items-center justify-end gap-1 font-black tabular-nums",
          drift.drift > 0 ? 'text-red-400' : drift.drift < 0 ? 'text-emerald-400' : 'text-slate-500'
        )}>
          {drift.drift > 0 ? <TrendingUp className="h-3 w-3" /> : drift.drift < 0 ? <TrendingDown className="h-3 w-3" /> : null}
          {formatPercentage(drift.drift)}
        </div>
      </td>

      {/* Action Tag */}
      <td className="px-6 py-4">
        <div className="flex justify-center">
          {isAligned ? (
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-widest border border-white/5">
              Balanced
            </span>
          ) : (
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
              drift.actionAmount > 0 
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                : "bg-red-500/10 text-red-400 border-red-500/20"
            )}>
              {drift.actionAmount > 0 ? "Underweight" : "Overweight"}
            </span>
          )}
        </div>
      </td>

      {/* Suggested Trade */}
      <td className="px-6 py-4 text-right">
        {isAligned ? (
          <span className="text-slate-600 font-medium italic">No action required</span>
        ) : (
          <div className="flex flex-col items-end">
             <div className={cn(
               "flex items-center gap-2 font-black tabular-nums",
               drift.actionAmount > 0 ? 'text-emerald-400' : 'text-red-400'
             )}>
                {drift.actionAmount > 0 ? "BUY" : "SELL"}
                <ArrowRight className="h-3 w-3 opacity-50" />
                {drift.currentPrice > 0 
                  ? (Math.abs(drift.actionAmount) / drift.currentPrice).toLocaleString('en-US', { maximumFractionDigits: 4 })
                  : "?"
                }
                <span className="text-[10px] text-slate-500 font-bold ml-0.5">SHARES</span>
             </div>
             <div className="text-[10px] text-slate-500 font-medium">
                @ {formatVND(drift.currentPrice)} / unit
             </div>
          </div>
        )}
      </td>

      {/* Cash Requirement */}
      <td className="px-6 py-4 text-right font-black tabular-nums text-white">
        {isAligned ? "—" : formatVND(Math.abs(drift.actionAmount))}
      </td>
    </tr>
  );
}
