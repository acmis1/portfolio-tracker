import { Suspense } from 'react'
import { DashboardSummary } from '@/features/portfolio/components/dashboard-summary'
import { GrowthChart } from '@/features/portfolio/components/growth-chart'
import { AllocationChart } from '@/features/portfolio/components/allocation-chart'
import { TopHoldings } from '@/features/holdings/components/top-holdings'
import { RecentActivity } from '@/features/portfolio/components/recent-activity'
import { getPortfolioSnapshots } from '@/features/portfolio/actions/rebalance'
import { getPortfolioSummary } from '@/features/portfolio/utils'
import { getVietnamMacro } from '@/features/portfolio/actions/macro'
import { getCashTransactions } from '@/features/cash/actions'

export default async function DashboardPage() {
  const [historyData, summary, macro, cashTransactions] = await Promise.all([
    getPortfolioSnapshots(),
    getPortfolioSummary(),
    getVietnamMacro(),
    getCashTransactions()
  ]);

  return (
    <main className="min-h-screen bg-slate-950 p-6 lg:p-10">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl space-y-10">
        {/* 1. Header & Primary KPIs */}
        <div className="space-y-8">
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

          <Suspense fallback={<div className="h-64 w-full animate-pulse rounded-2xl glass-premium" />}>
            <DashboardSummary summary={summary} macro={macro} />
          </Suspense>
        </div>

        {/* 2. Analytics Grid (Growth + Allocation) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 px-1">
              Performance Analytics
            </h2>
            <GrowthChart data={historyData} />
          </div>

          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 px-1">
              Asset Allocation
            </h2>
            <AllocationChart holdings={summary.holdings} />
          </div>
        </div>

        {/* 3. Operational Grid (Top Holdings + Recent Activity) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 px-1">
              Top Assets
            </h2>
            <Suspense fallback={<div className="h-full min-h-[400px] w-full animate-pulse rounded-2xl glass-premium" />}>
              <TopHoldings holdings={summary.holdings} />
            </Suspense>
          </div>
          
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 px-1">
              Recent Activity
            </h2>
            <Suspense fallback={<div className="h-64 w-full animate-pulse rounded-2xl glass-premium" />}>
              <RecentActivity transactions={cashTransactions} />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  )
}
