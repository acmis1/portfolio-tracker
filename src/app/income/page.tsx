import { IncomeSummary } from "@/features/income/components/income-summary";
import { IncomeChart } from "@/features/income/components/income-chart";
import { RecentPayoutsTable } from "@/features/income/components/recent-payouts-table";
import { getIncomeHistory } from "@/features/income/actions";

export const metadata = {
  title: "Income & Yield Analysis | Aegis Ledger",
  description: "Track and visualize passive cash flow from dividends and interest.",
};

export default async function IncomePage() {
  const { history, summary, recent } = await getIncomeHistory();

  return (
    <main className="min-h-screen p-8 pt-12">
      <div className="mx-auto max-w-7xl">
        {/* Header Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-black tracking-tight text-white glow-text-subtle">
            Income <span className="text-emerald-500">&</span> Yield
          </h1>
          <p className="mt-2 text-slate-400 font-medium tracking-wide uppercase text-xs">
            Aegis Ledger &middot; Passive Cash Flow Intelligence &middot; Real-time Yield Monitoring
          </p>
        </div>

        {/* Summary Metrics */}
        <div className="mb-8">
          <IncomeSummary summary={summary} />
        </div>

        {/* Chart Section */}
        <div className="mb-8">
          <IncomeChart data={history} />
        </div>

        {/* Table Section */}
        <div className="grid gap-8">
          <RecentPayoutsTable transactions={recent} />
        </div>

        {/* Footer Audit Trail Notice */}
        <div className="mt-12 border-t border-white/5 pt-8 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
          Aegis Ledger &middot; Income & Yield Audit &middot; Institutional Grade Verification
        </div>
      </div>
    </main>
  );
}
