import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getAssetDetails } from "@/features/holdings/actions"
import { AssetHeader } from "@/features/holdings/components/asset-header"
import { AssetTransactionTable } from "@/features/holdings/components/asset-transaction-table"
import { AssetPriceChart } from "@/features/holdings/components/asset-price-chart"
import { BenchmarkCards } from "@/features/holdings/components/benchmark-cards"
import { getLiveExchangeRate } from "@/lib/fx"

interface AssetPageProps {
  params: Promise<{ id: string }>
}

export default async function AssetPage({ params }: AssetPageProps) {
  const { id } = await params;
  const [assetData, fxRate] = await Promise.all([
    getAssetDetails(id),
    getLiveExchangeRate()
  ]);

  if (!assetData) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 lg:p-10">
      {/* Background Atmosphere (consistent with dashboard) */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl space-y-10">
        <Suspense fallback={<div className="h-64 w-full animate-pulse rounded-2xl glass-premium" />}>
          <AssetHeader asset={assetData} fxRate={fxRate} />
        </Suspense>

        <Suspense fallback={<div className="h-[400px] w-full animate-pulse rounded-2xl glass-premium" />}>
          <AssetPriceChart prices={assetData.prices} />
        </Suspense>

        <Suspense fallback={<div className="h-24 w-full animate-pulse rounded-2xl glass-premium" />}>
          <BenchmarkCards assetXirr={assetData.holding.xirr} />
        </Suspense>

        <Suspense fallback={<div className="h-64 w-full animate-pulse rounded-2xl glass-premium" />}>
          <AssetTransactionTable 
            transactions={assetData.transactions} 
            symbol={assetData.symbol}
            assetName={assetData.name}
            assetClass={assetData.assetClass}
            assetCurrency={assetData.currency}
            fxRate={fxRate}
          />
        </Suspense>
      </div>
    </main>
  )
}
