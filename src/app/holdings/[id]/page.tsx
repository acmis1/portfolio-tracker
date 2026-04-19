import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getAssetDetails } from "@/features/holdings/actions"
import { getLiveExchangeRate } from "@/lib/fx"
import { AssetDetailView } from "@/features/holdings/components/asset-detail-view"

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
      {/* Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <Suspense fallback={<div className="h-screen w-full animate-pulse rounded-2xl glass-premium" />}>
          <AssetDetailView assetData={assetData} fxRate={fxRate} />
        </Suspense>
      </div>
    </main>
  )
}
