import { getRebalancePlan } from "@/features/portfolio/actions/rebalance";
import { AllocationSummary } from "@/features/portfolio/components/allocation-summary";
import { DriftTable } from "@/features/portfolio/components/drift-table";
import { ManualTradePlan } from "@/features/portfolio/components/manual-trade-plan";
import { ShieldCheck, ArrowLeft, Info, FileText } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

import { getTargetAllocations } from "@/features/portfolio/actions/allocations";

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

  return (
    <main className="min-h-screen bg-[#020617] text-slate-200 selection:bg-emerald-500/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        
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

        {/* 2. Manual Trade Plan (New primary actionable output) */}
        <div className="mb-12">
          <ManualTradePlan nodes={plan.nodes} totalAum={plan.totalAum} />
        </div>

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
      </div>
    </main>
  );
}
