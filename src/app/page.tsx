import { getLiveExchangeRate } from "@/lib/fx"
import { OverviewCards } from '@/features/portfolio/components/overview-cards'
import { GrowthChart } from '@/features/portfolio/components/growth-chart'
import { AllocationChart } from '@/features/portfolio/components/allocation-chart'
import { Suspense } from 'react'
import { TopHoldings } from '@/features/holdings/components/top-holdings'
import { getHoldingsLedger, getPortfolioSummary, getAssetClassPerformance } from "@/features/portfolio/utils"
import { getPortfolioSnapshots } from "@/features/portfolio/actions/rebalance"
import { cn } from '@/lib/utils'
import { CashLedgerTable } from '@/features/cash/components/cash-ledger-table'
import { PerformanceAttribution } from '@/features/portfolio/components/performance-attribution'
import { getCashBalance } from "@/features/cash/actions"

import { getVietnamMacro } from "@/features/portfolio/actions/macro"
import { getCashTransactions } from "@/features/cash/actions"

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
  const [historyData, summary, fxRate, assetPerformance, macro, cashTransactions] = await Promise.all([
    getPortfolioSnapshots(),
    getPortfolioSummary(),
    getLiveExchangeRate(),
    getAssetClassPerformance(),
    getVietnamMacro(),
    getCashTransactions()
  ]);

  // Prepare allocation data from unified holdings (excluding CASH for clean visualization)
  const allocationData = summary.holdings
    .filter(h => h.assetClass !== 'CASH' && h.marketValue > 0)
    .map(h => ({
      name: h.assetClass,
      value: h.marketValue || 0
    }));

  return (
    <main className="min-h-screen bg-slate-950 p-6 lg:p-10">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl space-y-6">
        {/* Header section */}
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between px-1">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">
              Wealth Management
            </h1>
            <p className="text-slate-400 font-medium">
              Real-time portfolio intelligence and performance analytics
            </p>
          </div>
        </div>

        {/* Row 1: Overview Cards */}
        <div className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 px-1">
            Portfolio Overview
          </h2>
          <Suspense fallback={<div className="h-32 w-full animate-pulse rounded-2xl glass-premium" />}>
            <OverviewCards summary={summary} macro={macro} />
          </Suspense>
        </div>

        {/* Row 2: Performance Attribution */}
        <div className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 px-1">
            Performance Attribution
          </h2>
          <PerformanceAttribution summary={summary} />
        </div>

        {/* Row 3: Analytics Grid (Growth + Allocation) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Growth Chart (Span 2) */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 px-1">
              Growth & Performance
            </h2>
            <GrowthChart data={historyData} />
          </div>

          {/* Asset Allocation (Span 1) */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 px-1">
              Asset Allocation
            </h2>
            <AllocationChart data={allocationData} />
          </div>
        </div>

        {/* Row 4: Secondary Data Grid (Top Holdings + Cash) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Holdings (Span 1) */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 px-1">
              Top Holdings
            </h2>
            <Suspense fallback={<div className="h-full min-h-[400px] w-full animate-pulse rounded-2xl glass-premium" />}>
              <TopHoldings holdings={summary.holdings} />
            </Suspense>
          </div>
          
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 px-1">
              Cash Ledger
            </h2>
            <Suspense fallback={<div className="h-64 w-full animate-pulse rounded-2xl glass-premium" />}>
              <CashLedgerTable transactions={cashTransactions} />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  )
}
