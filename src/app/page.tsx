import { getLiveExchangeRate } from "@/lib/fx"
import { OverviewCards } from '@/features/portfolio/components/overview-cards'
import { GrowthChart } from '@/features/portfolio/components/growth-chart'
import { AllocationChart } from '@/features/portfolio/components/allocation-chart'
import { Suspense } from 'react'
import { TopHoldings } from '@/features/holdings/components/top-holdings'
import { getHoldingsLedger, getPortfolioSummary, getAssetClassPerformance } from "@/features/portfolio/utils"
import { getPortfolioSnapshots } from "@/features/portfolio/actions/rebalancing"
import { cn } from '@/lib/utils'
import { CashLedgerTable } from '@/features/cash/components/cash-ledger-table'
import { PerformanceAttribution } from '@/features/portfolio/components/performance-attribution'
import { formatAssetClass } from "@/lib/formatters"

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
  const [holdings, historyData, summary, fxRate, assetPerformance] = await Promise.all([
    getHoldingsLedger(),
    getPortfolioSnapshots(),
    getPortfolioSummary(),
    getLiveExchangeRate(),
    getAssetClassPerformance()
  ]);

  // Transform holdings into chart data
  const totalMarketValue = holdings.reduce((sum: number, h: any) => sum + (h.marketValue || 0), 0);
  
  const allocation = holdings.reduce((acc: any[], h: any) => {
    const className = formatAssetClass(h.assetClass);
    const existing = acc.find((a: any) => a.name === className);
    if (existing) {
      existing.value += (h.marketValue || 0);
    } else {
      const colors: Record<string, string> = {
        'CRYPTO': '#3b82f6',
        'STOCK': '#10b981',
        'MUTUAL_FUND': '#8b5cf6',
        'GOLD': '#fbbf24',
        'TERM_DEPOSIT': '#f472b6',
        'REAL_ESTATE': '#64748b'
      };
      acc.push({ 
        name: className, 
        value: h.marketValue || 0,
        color: colors[h.assetClass] || '#94a3b8'
      });
    }
    return acc;
  }, [] as { name: string; value: number; color: string }[]);

  const allocationData = allocation.map((a: any) => ({
    ...a,
    value: totalMarketValue > 0 ? (a.value / totalMarketValue) * 100 : 0
  })).filter((a: any) => a.value > 0);

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
            <OverviewCards />
          </Suspense>
        </div>

        {/* Row 2: Performance Attribution */}
        <div className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 px-1">
            Performance Attribution
          </h2>
          <PerformanceAttribution data={assetPerformance} />
        </div>

        {/* Row 3: Analytics Grid (Growth + Top Holdings) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Growth Chart (Span 2) */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 px-1">
              Growth & Performance
            </h2>
            <GrowthChart data={historyData} />
          </div>

          {/* Top Holdings (Span 1) */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 px-1">
              Top Holdings
            </h2>
            <Suspense fallback={<div className="h-full min-h-[400px] w-full animate-pulse rounded-2xl glass-premium" />}>
              <TopHoldings />
            </Suspense>
          </div>
        </div>

        {/* Row 4: Asset Allocation & Secondary Data */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 px-1">
              Asset Allocation
            </h2>
            <AllocationChart data={allocationData} />
          </div>
          
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 px-1">
              Cash Ledger
            </h2>
            <Suspense fallback={<div className="h-64 w-full animate-pulse rounded-2xl glass-premium" />}>
              <CashLedgerTable />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  )
}
