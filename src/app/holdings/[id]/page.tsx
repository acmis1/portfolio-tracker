import { notFound, redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { getAssetDetail } from "@/features/holdings/queries"
import { formatVND, formatQuantity, formatAssetDisplay, formatAssetClass } from "@/lib/utils/format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Info
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { PriceUpdateModal } from "@/features/holdings/components/price-update-modal"
import { AssetTransactionTable } from "@/features/holdings/components/asset-transaction-table"
import { getLiveExchangeRate } from "@/lib/fx"
import { LiquidHolding, GoldHolding, RealEstateHolding, TermDepositHolding } from "@/features/portfolio/types"
import { PageShell } from "@/components/layout/page-shell"

interface AssetDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function AssetDetailPage({ params }: AssetDetailPageProps) {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const { id } = await params
  const data = await getAssetDetail(id)
  if (!data) notFound()

  const { asset, holding, transactions } = data
  const labels = formatAssetDisplay(asset.symbol, asset.name)
  const fxRate = await getLiveExchangeRate()

  const isPositive = (holding?.unrealizedPnLPctg ?? 0) >= 0

  return (
    <PageShell contentClassName="space-y-8 pb-20">
      {/* Header / Breadcrumbs */}
      <div className="flex items-center gap-4">
        <Link href="/holdings">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
            <ArrowLeft className="h-4 w-4 text-slate-400" />
          </Button>
        </Link>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Holdings</span>
            <span className="text-[10px] text-slate-700">/</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">{formatAssetClass(asset.assetClass)}</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">{labels.primary}</h1>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 glass-premium rounded-3xl p-8 border border-white/5 flex flex-col justify-between min-h-[240px]">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Market Value</span>
              <Badge variant="outline" className={cn(
                "border-0 font-black h-6",
                isPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
              )}>
                {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {isPositive ? '+' : ''}{holding?.unrealizedPnLPctg?.toFixed(2)}%
              </Badge>
            </div>
            <div className="mt-4">
              <span className="text-5xl font-black tracking-tighter text-white tabular-nums">
                {formatVND(holding?.marketValue ?? 0)}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-8 pt-8 border-t border-white/5">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Quantity</span>
              <span className="text-sm font-bold text-slate-200">{formatQuantity(holding?.quantity ?? 0)}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Avg Cost</span>
              <span className="text-sm font-bold text-slate-200">{formatVND(holding?.avgCost ?? 0)}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                {asset.assetClass === 'TERM_DEPOSIT' ? 'Accrued Value' :
                 asset.assetClass === 'REAL_ESTATE' ? 'Latest Valuation' : 'Live Price'}
              </span>
              <span className="text-sm font-bold text-slate-200">
                {(() => {
                  if (!holding) return "—";
                  let val: number | null = null;
                  if (holding.type === 'TERM_DEPOSIT') val = (holding as TermDepositHolding).marketValue;
                  else if (holding.type === 'REAL_ESTATE') val = (holding as RealEstateHolding).currentValuation;
                  else if (holding.type === 'GOLD' || holding.type === 'LIQUID') val = (holding as LiquidHolding | GoldHolding).livePrice;

                  return val !== null && val !== 0 ? formatVND(val) : "—";
                })()}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Unrealized PnL</span>
              <span className={cn("text-sm font-bold", isPositive ? "text-emerald-400" : "text-rose-400")}>
                {isPositive ? '+' : ''}{formatVND(holding?.unrealizedPnL ?? 0)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Allocation</span>
              <span className="text-sm font-bold text-slate-200">{holding?.weight?.toFixed(2)}%</span>
            </div>
          </div>
        </div>

        <div className="glass-premium rounded-3xl p-8 border border-white/5 space-y-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Info className="h-3 w-3" /> Asset Details
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Full Name</span>
              <span className="text-xs font-bold text-slate-200 text-right max-w-[150px] truncate">{asset.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Symbol</span>
              <span className="text-xs font-bold text-slate-200">{asset.symbol}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Class</span>
              <span className="text-xs font-bold text-slate-200">{formatAssetClass(asset.assetClass)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Currency</span>
              <span className="text-xs font-bold text-slate-200">{asset.currency}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-white/5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                {asset.assetClass === 'TERM_DEPOSIT' ? 'Accrued Value' :
                 asset.assetClass === 'REAL_ESTATE' ? 'Valuation' : 'Live Price'}
              </span>
              <span className="text-xs font-bold text-emerald-400">
                {(() => {
                  if (!holding) return "—";
                  let val: number | null = null;
                  if (holding.type === 'TERM_DEPOSIT') val = (holding as TermDepositHolding).marketValue;
                  else if (holding.type === 'REAL_ESTATE') val = (holding as RealEstateHolding).currentValuation;
                  else if (holding.type === 'GOLD' || holding.type === 'LIQUID') val = (holding as LiquidHolding | GoldHolding).livePrice;
                  return val !== null && val !== 0 ? formatVND(val) : "—";
                })()}
              </span>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5">
            <PriceUpdateModal 
              initialSymbol={asset.symbol} 
              initialCurrency={asset.currency}
              trigger={
                <Button variant="outline" className="w-full bg-white/5 border-white/10 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest h-10">
                  Update Price Point
                </Button>
              }
            />
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <AssetTransactionTable 
        transactions={transactions}
        assetId={asset.id}
        symbol={asset.symbol}
        assetName={asset.name}
        assetClass={asset.assetClass}
        assetCurrency={asset.currency}
        fxRate={fxRate}
        termDeposit={asset.termDeposits[0]}
      />
    </PageShell>
  )
}
