'use client'

import { useState, useTransition } from "react";
import { AssetDrift } from "../types";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { Input } from "@/components/ui/input";
import { updateTargetWeight } from "../actions/rebalancing";
import { ArrowRight, Save, Loader2, TrendingUp, TrendingDown } from "lucide-react";

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
              <th className="px-6 py-4 font-black uppercase tracking-wider text-slate-400">Asset</th>
              <th className="px-6 py-4 text-right font-black uppercase tracking-wider text-slate-400">Current Weight</th>
              <th className="px-6 py-4 text-center font-black uppercase tracking-wider text-slate-400 w-32">Target %</th>
              <th className="px-6 py-4 text-right font-black uppercase tracking-wider text-slate-400">Drift</th>
              <th className="px-6 py-4 text-right font-black uppercase tracking-wider text-slate-400">Rebalance Action</th>
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
  const [inputValue, setInputValue] = useState(drift.targetWeight.toString());
  const [isPending, startTransition] = useTransition();

  const handleUpdate = () => {
    const newWeight = parseFloat(inputValue);
    if (isNaN(newWeight) || newWeight < 0 || newWeight > 100) {
      setInputValue(drift.targetWeight.toString());
      return;
    }

    if (newWeight === drift.targetWeight) return;

    startTransition(async () => {
      await updateTargetWeight(drift.assetId, newWeight);
    });
  };

  const isSignificantDrift = Math.abs(drift.drift) > 1; // Highlight drift > 1%

  return (
    <tr className="hover:bg-white/5 transition-colors group">
      {/* Asset Info */}
      <td className="px-6 py-4">
        <div className="flex flex-col">
          <span className="font-bold text-white">{drift.symbol}</span>
          <span className="text-xs text-slate-500">{drift.name}</span>
        </div>
      </td>

      {/* Current Weight */}
      <td className="px-6 py-4 text-right font-medium text-slate-300">
        {formatPercentage(drift.currentWeight, false)}
      </td>

      {/* Target Weight (Inline Editor) */}
      <td className="px-6 py-4">
        <div className="relative flex items-center justify-center">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={handleUpdate}
            onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
            className="h-8 w-20 bg-slate-900/50 border-white/10 text-center font-bold text-white focus:ring-emerald-500/50"
            disabled={isPending}
          />
          {isPending && (
            <div className="absolute -right-6">
              <Loader2 className="h-3 w-3 animate-spin text-emerald-400" />
            </div>
          )}
        </div>
      </td>

      {/* Drift */}
      <td className="px-6 py-4 text-right">
        <div className={`flex items-center justify-end gap-1 font-bold ${
          drift.drift > 0 ? 'text-red-400' : drift.drift < 0 ? 'text-emerald-400' : 'text-slate-500'
        }`}>
          {drift.drift > 0 ? <TrendingUp className="h-3 w-3" /> : drift.drift < 0 ? <TrendingDown className="h-3 w-3" /> : null}
          {formatPercentage(drift.drift)}
        </div>
      </td>

      {/* Action */}
      <td className="px-6 py-4 text-right">
        {Math.abs(drift.actionAmount) < 1000 ? ( // Ignore micro-adjustments < 1000 VND
           <span className="text-xs text-slate-500 italic">Aligned</span>
        ) : (
          <div className="flex flex-col items-end">
             <div className={`flex items-center gap-2 font-black ${drift.actionAmount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {drift.actionAmount > 0 ? "BUY" : "SELL"}
                <ArrowRight className="h-3 w-3" />
                {formatCurrency(Math.abs(drift.actionAmount))}
             </div>
             <span className="text-[10px] uppercase tracking-tighter text-slate-500">
                {drift.actionAmount > 0 ? "Underweight" : "Overweight"}
             </span>
          </div>
        )}
      </td>
    </tr>
  );
}
