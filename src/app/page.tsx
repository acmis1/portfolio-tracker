import { OverviewCards } from '@/components/overview-cards'
import { GrowthChart } from '@/components/charts/growth-chart'
import { AllocationChart } from '@/components/charts/allocation-chart'
import { Suspense } from 'react'
import { HoldingsTable } from '@/components/holdings-table'

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-950 p-6 lg:p-10">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl space-y-8">
        {/* Header section */}
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">
              Wealth Management
            </h1>
            <p className="text-slate-400 font-medium">
              Real-time portfolio intelligence and performance analytics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-500/80">
              Live System Status
            </span>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <GrowthChart />
          </div>
          <div>
            <AllocationChart />
          </div>
        </div>

        {/* Holdings Ledger */}
        <div className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
            Holdings Ledger
          </h2>
          <Suspense fallback={<div className="h-64 w-full animate-pulse rounded-2xl glass-premium" />}>
            <HoldingsTable />
          </Suspense>
        </div>

        {/* Overview cards */}
        <div>
          <h2 className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
            Performance Overview
          </h2>
          <Suspense fallback={<div className="h-48 w-full animate-pulse rounded-2xl glass-premium" />}>
            <OverviewCards />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
