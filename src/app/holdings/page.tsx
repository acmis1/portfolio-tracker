import { Suspense } from "react"
import { getPortfolioSummary } from "@/features/portfolio/utils"
import { getLiveExchangeRate } from "@/lib/fx"
import { HoldingsLedger } from "@/features/holdings/components/holdings-ledger"
import { PageShell } from "@/components/layout/page-shell"

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HoldingsPage() {
  const [summary, fxRate] = await Promise.all([
    getPortfolioSummary(),
    getLiveExchangeRate()
  ]);

  return (
    <PageShell contentClassName="space-y-10">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">
          Asset Holdings
        </h1>
        <p className="text-slate-400 font-medium">
          Consolidated ledger of all positions across asset classes
        </p>
      </div>

      <Suspense fallback={<div className="h-64 w-full animate-pulse rounded-2xl glass-premium" />}>
        <HoldingsLedger summary={summary} fxRate={fxRate} />
      </Suspense>
    </PageShell>
  );
}
