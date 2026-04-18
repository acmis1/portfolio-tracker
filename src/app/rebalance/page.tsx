import { getRebalancingDrift } from "@/features/portfolio/actions/rebalancing";
import { AllocationSummary } from "@/features/portfolio/components/allocation-summary";
import { DriftTable } from "@/features/portfolio/components/drift-table";
import { ExecutionModal } from "@/features/portfolio/components/execution-modal";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Rebalancing & Drift Analysis | Aegis Ledger",
  description: "Institutional-grade portfolio rebalancing and allocation control.",
};

export default async function RebalancePage() {
  const summary = await getRebalancingDrift();

  return (
    <main className="min-h-screen bg-[#020617] text-slate-200 selection:bg-emerald-500/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        
        {/* Header Segment */}
        <div className="mb-12 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-400">
                <ShieldCheck className="h-3 w-3" />
                <span>Rebalancing Engine Active</span>
              </div>
              <Link href="/">
                <Button variant="ghost" size="sm" className="h-6 text-[10px] uppercase font-bold text-slate-500 hover:text-white">
                  <ArrowLeft className="mr-1 h-3 w-3" /> Back to Dashboard
                </Button>
              </Link>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
              Execution <span className="text-emerald-500">Drift</span>
            </h1>
            <p className="mt-2 text-lg text-slate-400">
              Align holdings with target weights to optimize risk-adjusted returns.
            </p>
          </div>

          <div className="flex shrink-0">
            <ExecutionModal drifts={summary.drifts} cashBalance={summary.cashBalance} />
          </div>
        </div>

        {/* Performance & Allocation Logic */}
        <AllocationSummary summary={summary} />

        {/* Drift Analysis Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-white px-1">Holding Deviations</h2>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Live calculated based on {summary.drifts.length} assets
            </span>
          </div>
          <DriftTable drifts={summary.drifts} />
        </div>

        {/* Footer Audit Trail Notice */}
        <div className="mt-12 border-t border-white/5 pt-8 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
          Aegis Ledger &middot; Portfolio Drift Analysis &middot; Institutional Grade Verification
        </div>
      </div>
    </main>
  );
}
