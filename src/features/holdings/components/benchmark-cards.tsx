import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatPercentage } from "@/lib/formatters"
import { Target, Landmark, ShieldCheck, Zap } from "lucide-react"

interface BenchmarkCardsProps {
  assetXirr: number | null;
  riskFreeRate: number;
  marketBaseline: number;
}

export function BenchmarkCards({ assetXirr, riskFreeRate, marketBaseline }: BenchmarkCardsProps) {
  const alphaRfr = assetXirr !== null ? assetXirr - riskFreeRate : null;
  const alphaMarket = assetXirr !== null ? assetXirr - marketBaseline : null;

  return (
    <div className="grid gap-6 md:grid-cols-4">
      <Card className="glass-premium border-white/5">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">VN 10Y Gov Bond Yield</CardTitle>
          <ShieldCheck className="h-3 w-3 text-slate-600" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-black text-white">
            {formatPercentage(riskFreeRate)}
          </div>
          <p className="text-[10px] text-slate-600 font-bold mt-1 uppercase tracking-tighter">HNX Par Yield</p>
        </CardContent>
      </Card>

      <Card className="glass-premium border-white/5">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">VN-Index 1Y Target</CardTitle>
          <Landmark className="h-3 w-3 text-slate-600" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-black text-white">
            {formatPercentage(marketBaseline)}
          </div>
          <p className="text-[10px] text-slate-600 font-bold mt-1 uppercase tracking-tighter">Market Baseline</p>
        </CardContent>
      </Card>

      <Card className="glass-premium border-white/5">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Alpha vs RFR</CardTitle>
          <Target className="h-3 w-3 text-slate-600" />
        </CardHeader>
        <CardContent>
          {alphaRfr !== null ? (
            <>
              <div className={`text-xl font-black ${alphaRfr >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {formatPercentage(alphaRfr)}
              </div>
              <p className="text-[10px] text-slate-600 font-bold mt-1 uppercase tracking-tighter">Spread over Cash</p>
            </>
          ) : (
            <div className="text-slate-600 italic text-sm">N/A</div>
          )}
        </CardContent>
      </Card>

      <Card className="glass-premium border-white/5">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Market Alpha</CardTitle>
          <Zap className="h-3 w-3 text-slate-600" />
        </CardHeader>
        <CardContent>
          {alphaMarket !== null ? (
            <>
              <div className={`text-xl font-black ${alphaMarket >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {formatPercentage(alphaMarket)}
              </div>
              <p className="text-[10px] text-slate-600 font-bold mt-1 uppercase tracking-tighter">Excess Return</p>
            </>
          ) : (
            <div className="text-slate-600 italic text-sm">N/A</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
