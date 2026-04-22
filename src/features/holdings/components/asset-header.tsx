import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, formatPercentage } from "@/lib/formatters"
import { TrendingUp, TrendingDown, LayoutDashboard, Home, Calculator } from "lucide-react"
import Link from "next/link"
import { PriceUpdateModal } from "./price-update-modal"
import { Button } from "@/components/ui/button"

interface AssetHeaderProps {
  asset: {
    symbol: string;
    name: string;
    assetClass: string;
    currency: string;
    holding: {
      quantity: number;
      avgCost: number;
      livePrice: number | null;
      marketValue: number;
      accruedInterest: number;
      unrealizedPnL: number | null;
      unrealizedPnLPctg: number | null;
      xirr: number | null;
      isShortTerm: boolean;
    };
    termDeposit?: {
      principal: number;
      interestRate: number;
    } | null;
  };
  fxRate: number;
}

export function AssetHeader({ asset, fxRate }: AssetHeaderProps) {
    const { holding } = asset;
    const isUSD = asset.currency === 'USD';
    const isTD = asset.assetClass === 'TERM_DEPOSIT';
    const isRE = asset.assetClass === 'REAL_ESTATE';

    // Late-stage presentation conversion using dynamic fxRate
    const displayLivePrice = isUSD && holding.livePrice !== null ? holding.livePrice / fxRate : holding.livePrice;
    const displayAvgCost = isUSD ? holding.avgCost / fxRate : holding.avgCost;
    
    // Valuation and performance in base currency VND
    const displayMarketValue = holding.marketValue;
    const displayPnL = holding.unrealizedPnL;
    
    const isProfit = (holding.unrealizedPnL || 0) >= 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-4xl font-black tracking-tight text-white">
              {isRE || isTD ? asset.name : asset.symbol}
            </h1>
            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold uppercase tracking-widest text-slate-400">
              {asset.assetClass.replace('_', ' ')}
            </span>
          </div>
          {!isTD && !isRE && (
            <p className="text-slate-400 font-medium">
              {asset.name}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isRE && (
            <PriceUpdateModal 
              initialSymbol={asset.symbol}
              initialCurrency={asset.currency}
              title="Update Property Appraisal"
              trigger={
                <Button variant="outline" size="sm" className="glass-premium border-white/10 text-slate-400 hover:text-white">
                  <Home className="mr-2 h-4 w-4" /> Update Appraisal
                </Button>
              }
            />
          )}
          <Link 
            href="/" 
            className="flex items-center gap-2 px-4 py-2 rounded-xl glass-premium text-slate-400 hover:text-white transition-colors text-sm font-bold"
          >
            <LayoutDashboard className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-5">
        <Card className="glass-premium border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              {isTD ? "Principal Amount" : `Live Price (${asset.currency})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-white">
              {isTD ? (
                formatCurrency(asset.termDeposit?.principal || 0, asset.currency)
              ) : (
                displayLivePrice !== null ? formatCurrency(displayLivePrice, asset.currency) : "N/A"
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-premium border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Market Value (VND)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-white">
              {formatCurrency(displayMarketValue, 'VND')}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {isTD ? "Including Accruals" : `${holding.quantity.toLocaleString()} units`}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-premium border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              {isTD ? "Accrued Interest" : `Average Cost (${asset.currency})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-white">
              {isTD ? (
                formatCurrency(holding.accruedInterest, 'VND')
              ) : (
                formatCurrency(displayAvgCost, asset.currency)
              )}
            </div>
          </CardContent>
        </Card>

        {!isTD && (
          <>
            <Card className={holding.unrealizedPnL !== null ? (isProfit ? "bg-emerald-500/5 border-emerald-500/10" : "bg-red-500/5 border-red-500/10") : "glass-premium border-white/5"}>
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Total P&L (VND)</CardTitle>
              </CardHeader>
              <CardContent>
                {displayPnL !== null ? (
                  <>
                    <div className={`text-2xl font-black ${isProfit ? "text-emerald-400" : "text-red-400"}`}>
                      {formatCurrency(displayPnL, 'VND')}
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-bold mt-1 ${isProfit ? "text-emerald-500/70" : "text-red-500/70"}`}>
                      {isProfit ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {formatPercentage(holding.unrealizedPnLPctg!)}
                    </div>
                  </>
                ) : (
                  <div className="text-slate-500 italic text-sm">No data</div>
                )}
              </CardContent>
            </Card>

            <Card className="glass-premium border-white/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Annualized Return</CardTitle>
              </CardHeader>
              <CardContent>
                {holding.xirr !== null ? (
                  <div className={`text-2xl font-black ${holding.xirr >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {formatPercentage(holding.xirr)}
                    <span className="text-[10px] ml-1 text-slate-500 font-bold tracking-tight">XIRR</span>
                  </div>
                ) : (
                  <div className="text-slate-500 italic text-[10px] font-bold leading-tight uppercase text-slate-600">
                    {holding.isShortTerm ? "Requires >30 day holding period" : "Insufficient Data"}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
