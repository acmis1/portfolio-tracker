import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, formatPercentage } from "@/lib/formatters"
import { TrendingUp, TrendingDown, LayoutDashboard } from "lucide-react"
import Link from "next/link"

interface AssetHeaderProps {
  asset: {
    symbol: string;
    name: string;
    assetClass: string;
    holding: {
      quantity: number;
      avgCost: number;
      livePrice: number | null;
      marketValue: number;
      unrealizedPnL: number | null;
      unrealizedPnLPctg: number | null;
      xirr: number | null;
    }
  }
}

export function AssetHeader({ asset }: AssetHeaderProps) {
    const { holding } = asset;
    const isUSD = asset.currency === 'USD';
    const rate = 25400;

    const displayLivePrice = isUSD && holding.livePrice !== null ? holding.livePrice / rate : holding.livePrice;
    const displayMarketValue = isUSD ? holding.marketValue / rate : holding.marketValue;
    const displayAvgCost = isUSD ? holding.avgCost / rate : holding.avgCost;
    const displayPnL = isUSD && holding.unrealizedPnL !== null ? holding.unrealizedPnL / rate : holding.unrealizedPnL;
    
    const isProfit = (holding.unrealizedPnL || 0) >= 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-4xl font-black tracking-tight text-white">{asset.symbol}</h1>
            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold uppercase tracking-widest text-slate-400">
              {asset.assetClass.replace('_', ' ')}
            </span>
          </div>
          <p className="text-slate-400 font-medium">{asset.name}</p>
        </div>
        <Link 
          href="/" 
          className="flex items-center gap-2 px-4 py-2 rounded-xl glass-premium text-slate-400 hover:text-white transition-colors text-sm font-bold"
        >
          <LayoutDashboard className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-5">
        <Card className="glass-premium border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Live Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-white">
              {displayLivePrice !== null ? formatCurrency(displayLivePrice, asset.currency) : "N/A"}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-premium border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Market Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-white">
              {formatCurrency(displayMarketValue, asset.currency)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {holding.quantity.toLocaleString()} units
            </div>
          </CardContent>
        </Card>

        <Card className="glass-premium border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Average Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-white">
              {formatCurrency(displayAvgCost, asset.currency)}
            </div>
          </CardContent>
        </Card>

        <Card className={holding.unrealizedPnL !== null ? (isProfit ? "bg-emerald-500/5 border-emerald-500/10" : "bg-red-500/5 border-red-500/10") : "glass-premium border-white/5"}>
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Unrealized P&L</CardTitle>
          </CardHeader>
          <CardContent>
            {displayPnL !== null ? (
              <>
                <div className={`text-2xl font-black ${isProfit ? "text-emerald-400" : "text-red-400"}`}>
                  {isProfit ? "+" : ""}{formatCurrency(displayPnL, asset.currency)}
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
                {holding.xirr > 0 ? "+" : ""}{formatPercentage(holding.xirr)}
                <span className="text-[10px] ml-1 text-slate-500 font-bold tracking-tight">XIRR</span>
              </div>
            ) : (
              <div className="text-slate-500 italic text-sm">Requires more data</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
