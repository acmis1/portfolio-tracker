import { Suspense } from 'react'
import { Skeleton } from "@/components/ui/skeleton"
import { DashboardSummary } from '@/features/portfolio/components/dashboard-summary'
import { GrowthChart } from '@/features/portfolio/components/growth-chart'
import { AllocationChart } from '@/features/portfolio/components/allocation-chart'
import { TopHoldings } from '@/features/holdings/components/top-holdings'
import { RecentActivity } from '@/features/portfolio/components/recent-activity'
import { getPortfolioSnapshots } from '@/features/portfolio/actions/rebalance'
import { getPortfolioSummary } from '@/features/portfolio/utils'
import { getVietnamMacro } from '@/features/portfolio/actions/macro'
import { getUnifiedActivity } from '@/features/transactions/queries'

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

async function SummarySection() {
  const [summary, macro] = await Promise.all([
    getPortfolioSummary(),
    getVietnamMacro()
  ]);
  return <DashboardSummary summary={summary} macro={macro} />;
}

async function ChartsSection() {
  const [historyData, summary] = await Promise.all([
    getPortfolioSnapshots(),
    getPortfolioSummary()
  ]);
  
  return (
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
  );
}

async function TopHoldingsSection() {
  const summary = await getPortfolioSummary();
  return (
    <div className="space-y-4">
      <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 px-1">
        Top Assets
      </h2>
      <TopHoldings holdings={summary.holdings} />
    </div>
  );
}

async function RecentActivitySection({ userId }: { userId: string }) {
  const activities = await getUnifiedActivity(userId);
  return (
    <div className="space-y-4">
      <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 px-1">
        Recent Activity
      </h2>
      <RecentActivity activities={activities} />
    </div>
  );
}

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

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

          <Suspense fallback={<SummarySectionSkeleton />}>
            <SummarySection />
          </Suspense>
        </div>

        {/* 2. Analytics Grid */}
        <Suspense fallback={<ChartsSectionSkeleton />}>
          <ChartsSection />
        </Suspense>

        {/* 3. Operational Grid */}
        <Suspense fallback={<ListSectionSkeleton />}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <TopHoldingsSection />
            </div>
            
            <div className="lg:col-span-2">
              <RecentActivitySection userId={userId} />
            </div>
          </div>
        </Suspense>
      </div>
    </main>
  )
}

function SummarySectionSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-32 w-full rounded-3xl" />
      ))}
    </div>
  )
}

function ChartsSectionSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <Skeleton className="h-[400px] w-full rounded-3xl" />
      </div>
      <div className="lg:col-span-1">
        <Skeleton className="h-[400px] w-full rounded-3xl" />
      </div>
    </div>
  )
}

function ListSectionSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <Skeleton className="h-[500px] w-full rounded-3xl" />
      </div>
      <div className="lg:col-span-2">
        <Skeleton className="h-[500px] w-full rounded-3xl" />
      </div>
    </div>
  )
}
