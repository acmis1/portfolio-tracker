import { OverviewCards } from '@/features/portfolio/components/overview-cards'
import { GrowthChart } from '@/features/portfolio/components/growth-chart'
import { AllocationChart } from '@/features/portfolio/components/allocation-chart'
import { Suspense } from 'react'
import { HoldingsTable } from '@/features/holdings/components/holdings-table'
import { getHoldingsLedger, getPortfolioSummary } from "@/features/portfolio/utils"
import { getPortfolioSnapshots } from "@/features/portfolio/actions/rebalancing"
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CashLedgerTable } from '@/features/cash/components/cash-ledger-table'
import { AddCashModal } from '@/features/cash/components/add-cash-modal'
import { PriceUpdateModal } from '@/features/holdings/components/price-update-modal'
import { TransactionModal } from '@/features/transactions/components/transaction-modal'

export default async function DashboardPage() {
  const [holdings, historyData, summary] = await Promise.all([
    getHoldingsLedger(),
    getPortfolioSnapshots(),
    getPortfolioSummary()
  ]);

  const lastPriceDate = summary.lastPriceDate;
  const isDataFresh = lastPriceDate ? new Date(lastPriceDate).toDateString() === new Date().toDateString() : false;
  
  // Transform holdings into chart data
  const totalMarketValue = holdings.reduce((sum, h) => sum + (h.marketValue || 0), 0);
  
  const allocation = holdings.reduce((acc, h) => {
    const existing = acc.find(a => a.name === h.assetClass);
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
        name: h.assetClass, 
        value: h.marketValue || 0,
        color: colors[h.assetClass] || '#94a3b8'
      });
    }
    return acc;
  }, [] as { name: string; value: number; color: string }[]);

  const allocationData = allocation.map(a => ({
    ...a,
    value: totalMarketValue > 0 ? (a.value / totalMarketValue) * 100 : 0
  })).filter(a => a.value > 0);

  return (
    <main className="min-h-screen bg-slate-950 p-6 lg:p-10">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl space-y-10">
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
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-3 cursor-help">
                  <div className={cn(
                    "h-2 w-2 rounded-full animate-pulse",
                    isDataFresh ? "bg-emerald-500" : "bg-amber-500"
                  )} />
                  <span className={cn(
                    "text-xs font-bold uppercase tracking-widest",
                    isDataFresh ? "text-emerald-500/80" : "text-amber-500/80"
                  )}>
                    {isDataFresh ? "Data Fresh" : "Prices Stale"}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Last successful sync: {lastPriceDate ? new Date(lastPriceDate).toLocaleString() : 'Never'}</p>
              </TooltipContent>
            </Tooltip>
            
            <div className="h-4 w-px bg-white/10 mx-1" />
            
            <PriceUpdateModal />
            
            <TransactionModal 
              trigger={
                <Button variant="premium" size="sm">
                  <Plus className="mr-2 h-4 w-4" /> Add Transaction
                </Button>
              } 
            />
          </div>
        </div>

        {/* 1. KPI Overview (Prioritized) */}
        <div className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
            Performance Overview
          </h2>
          <Suspense fallback={<div className="h-48 w-full animate-pulse rounded-2xl glass-premium" />}>
            <OverviewCards />
          </Suspense>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <GrowthChart data={historyData} />
          </div>
          <div>
            <AllocationChart data={allocationData} />
          </div>
        </div>

        {/* 3. Holdings Ledger */}
        <div className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
            Holdings Ledger
          </h2>
          <Suspense fallback={<div className="h-64 w-full animate-pulse rounded-2xl glass-premium" />}>
            <HoldingsTable />
          </Suspense>
        </div>

        {/* 4. Cash Ledger */}
        <div className="space-y-4 pb-12">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              Cash Ledger
            </h2>
            <AddCashModal />
          </div>
          <Suspense fallback={<div className="h-64 w-full animate-pulse rounded-2xl glass-premium" />}>
            <CashLedgerTable />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
