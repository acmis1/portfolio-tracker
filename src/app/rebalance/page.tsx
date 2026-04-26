import { getRebalancePlan } from "@/features/portfolio/actions/rebalance";
import { AllocationSummary } from "@/features/portfolio/components/allocation-summary";
import { DriftTable } from "@/features/portfolio/components/drift-table";
import { ManualTradePlan } from "@/features/portfolio/components/manual-trade-plan";
import { ArrowLeft, Info, FileText } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getTargetAllocations } from "@/features/portfolio/actions/allocations";
import { PageShell } from "@/components/layout/page-shell";

export const metadata = {
  title: "Manual Rebalance Plan | Aegis Ledger",
  description: "Institutional-grade portfolio rebalancing and allocation control.",
};

export default async function RebalancePage() {
  const [plan, targets] = await Promise.all([
    getRebalancePlan(),
    getTargetAllocations()
  ]);

  if (!plan) return <div>Unauthorized</div>;

  const totalTargetWeight = targets.reduce((sum, t) => sum + (t.targetWeight || 0), 0);
  const isStrategyValid = Math.abs(totalTargetWeight - 100) < 0.01;

  return (
    <PageShell className="text-slate-200 selection:bg-emerald-500/30">
      {/* Header Segment */}
      <div className="mb-12 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-400">
              <FileText className="h-3 w-3" />
              <span>Manual Strategy Planner</span>
            </div>
            <Link href="/">
              <Button variant="ghost" size="sm" className="h-6 text-[10px] uppercase font-bold text-slate-500 hover:text-white">
                <ArrowLeft className="mr-1 h-3 w-3" /> Back to Dashboard
              </Button>
            </Link>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
            Manual <span className="text-emerald-500">Rebalance</span> Plan
          </h1>
          <p className="mt-2 text-lg text-slate-400">
            Suggested reallocation strategy to align holdings with target weights.
          </p>
        </div>

        <div className="flex shrink-0">
          <div className="glass-premium rounded-xl border border-white/5 p-4 flex items-center gap-3">
            <div className="bg-emerald-500/10 p-2 rounded-lg">
              <Info className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase font-black tracking-widest text-slate-500">Mode</div>
              <div className="text-sm font-bold text-white">Advisory Only</div>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Strategy health / target setup */}
      <AllocationSummary plan={plan} />

      {/* 2. Manual Trade Plan (Gated by Strategy Validity) */}
      {isStrategyValid ? (
        <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <ManualTradePlan nodes={plan.nodes} totalAum={plan.totalAum} />
        </div>
      ) : (
        <div className="mb-12 glass-premium rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8 text-center">
          <Info className="h-8 w-8 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-black text-white uppercase tracking-widest mb-2">Strategy Setup Required</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            The rebalance planner is inactive because your target allocation is incomplete or does not sum to 100%. 
            Please configure your strategy below to generate trade suggestions.
          </p>
        </div>
      )}

      {/* 3. Existing drift table (Secondary analytical detail) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-white px-1">Holding Deviations</h2>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Live calculated based on {plan.nodes.length} nodes
          </span>
        </div>
        <DriftTable nodes={plan.nodes} initialTargets={targets} />
      </div>

      {/* Footer Audit Trail Notice */}
      <div className="mt-12 border-t border-white/5 pt-8 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
        Aegis Ledger &middot; Manual Rebalance Plan &middot; Read-Only Trade Suggestions
      </div>
    </PageShell>
  );
}
