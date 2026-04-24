import { Suspense } from "react"
import { getPortfolioSummary } from "@/features/portfolio/utils"
import { getLiveExchangeRate } from "@/lib/fx"
import { HoldingsLedger } from "@/features/holdings/components/holdings-ledger"

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HoldingsPage() {
  const [summary, fxRate] = await Promise.all([
    getPortfolioSummary(),
    getLiveExchangeRate()
  ]);

  return (
    <main className="min-h-screen bg-slate-950 p-6 lg:p-10">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl space-y-10">
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
      </div>
    </main>
  );
}
