import { EnhancedRebalancePlan } from "../actions/rebalance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { AlertCircle, CheckCircle2, Wallet } from "lucide-react";

interface AllocationSummaryProps {
  plan: EnhancedRebalancePlan;
}

export function AllocationSummary({ plan }: AllocationSummaryProps) {
  const totalTargetValue = plan.nodes.reduce((acc: number, node: any) => acc + node.targetValue, 0);
  const totalTargetWeight = plan.totalAum > 0 ? (totalTargetValue / plan.totalAum) * 100 : 0;
  const isOverAllocated = totalTargetWeight > 100.01; 
  const cashReserveTarget = Math.max(0, 100 - totalTargetWeight);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Total PV & Cash */}
      <Card className="glass-premium border-white/5 shadow-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
            <Wallet className="h-4 w-4" /> Portfolio Liquidity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black text-white">{formatCurrency(plan.totalAum || 0)}</div>
          <div className="text-xs text-slate-400 mt-1">
            Includes <span className="text-emerald-400 font-bold">{formatCurrency(plan.cashBalance)}</span> unallocated cash
          </div>
        </CardContent>
      </Card>

      {/* Target Allocation Status */}
      <Card className={`glass-premium border-white/5 shadow-2xl transition-all ${isOverAllocated ? 'ring-1 ring-red-500/50' : 'ring-1 ring-emerald-500/20'}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
            {isOverAllocated ? (
              <AlertCircle className="h-4 w-4 text-red-400" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            )}
            Target Allocation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-black ${isOverAllocated ? 'text-red-400' : 'text-white'}`}>
            {totalTargetWeight.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {isOverAllocated 
              ? "Total allocation exceeds 100%" 
              : `Implicit cash reserve: ${cashReserveTarget.toFixed(1)}%`}
          </div>
        </CardContent>
      </Card>

      {/* Rebalancing Signal */}
      <Card className="glass-premium border-white/5 shadow-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500">
            Portfolio Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black text-white">
            {plan.nodes.filter((d: any) => Math.abs(d.deltaCash) > (plan.totalAum * 0.05)).length > 0 ? "Drifting" : "Aligned"}
          </div>
          <div className="text-xs text-slate-400 mt-1">
          {plan.nodes.filter((d: any) => Math.abs(d.deltaCash) > (plan.totalAum * 0.05)).length} buckets deviate by {'>'} 5%
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
