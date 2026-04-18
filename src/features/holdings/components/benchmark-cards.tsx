import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatPercentage } from "@/lib/formatters"
import { Target, Landmark, ShieldCheck, Zap } from "lucide-react"

interface BenchmarkCardsProps {
  assetXirr: number | null;
}

const RFR = 5.5; // 5.5%
const MARKET_BENCHMARK = 10.0; // 10.0%

export function BenchmarkCards({ assetXirr }: BenchmarkCardsProps) {
  const alphaRfr = assetXirr !== null ? assetXirr - RFR : null;
  const alphaMarket = assetXirr !== null ? assetXirr - MARKET_BENCHMARK : null;

  return (
    <div className="grid gap-6 md:grid-cols-4">
      <Card className="glass-premium border-white/5">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Risk-Free Rate</CardTitle>
          <ShieldCheck className="h-3 w-3 text-slate-600" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-black text-white">
            {formatPercentage(RFR)}
          </div>
          <p className="text-[10px] text-slate-600 font-bold mt-1 uppercase tracking-tighter">Baseline Reference</p>
        </CardContent>
      </Card>

      <Card className="glass-premium border-white/5">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Market Baseline</CardTitle>
          <Landmark className="h-3 w-3 text-slate-600" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-black text-white">
            {formatPercentage(MARKET_BENCHMARK)}
          </div>
          <p className="text-[10px] text-slate-600 font-bold mt-1 uppercase tracking-tighter">Expected Return</p>
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
                {alphaRfr > 0 ? "+" : ""}{formatPercentage(alphaRfr)}
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
                {alphaMarket > 0 ? "+" : ""}{formatPercentage(alphaMarket)}
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
