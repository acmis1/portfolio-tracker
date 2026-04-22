import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { AssetHeader } from "./asset-header";
import { AssetTransactionTable } from "./asset-transaction-table";
import { AssetPriceChart } from "./asset-price-chart";
import { BenchmarkCards } from "./benchmark-cards";
import { Clock, TrendingUp, ShieldCheck, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";

interface AssetDetailViewProps {
  assetData: any;
  fxRate: number;
  macro: { riskFreeRate: number; marketBaseline: number };
}

export function AssetDetailView({ assetData, fxRate, macro }: AssetDetailViewProps) {
  const isTermDeposit = assetData.assetClass === 'TERM_DEPOSIT';
  const isRealEstate = assetData.assetClass === 'REAL_ESTATE';
  const isLiquid = !isTermDeposit && !isRealEstate;

  return (
    <div className="space-y-10">
      <AssetHeader asset={assetData} fxRate={fxRate} />

      {isLiquid && (
        <>
          <AssetPriceChart prices={assetData.prices} />
          <BenchmarkCards 
            assetXirr={assetData.holding.xirr} 
            riskFreeRate={macro.riskFreeRate}
            marketBaseline={macro.marketBaseline}
          />
        </>
      )}

      {isTermDeposit && assetData.termDeposit && (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="glass-premium p-6 rounded-2xl border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <Landmark className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Bank Details</span>
            </div>
            <div className="text-xl font-bold text-white">{assetData.termDeposit.bankName}</div>
            <div className="text-xs text-slate-500 italic">Established on {new Date(assetData.termDeposit.startDate).toLocaleDateString()}</div>
          </div>

          <div className="glass-premium p-6 rounded-2xl border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Yield Strategy</span>
            </div>
            <div className="text-xl font-bold text-white">{assetData.termDeposit.interestRate}% APY</div>
            <div className="text-xs text-slate-500 italic">Fixed Rate / Compound Simple</div>
          </div>

          <div className="glass-premium p-6 rounded-2xl border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <Clock className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Maturity Timeline</span>
            </div>
            <div className="text-xl font-bold text-white">
              {new Date(assetData.termDeposit.maturityDate).toLocaleDateString()}
            </div>
            <div className="text-xs text-slate-500 italic">
              {Math.ceil((new Date(assetData.termDeposit.maturityDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days remaining
            </div>
          </div>
        </div>
      )}

      {isRealEstate && (
        <div className="glass-premium p-8 rounded-2xl border border-white/5 flex flex-col items-center text-center space-y-4">
           <ShieldCheck className="h-12 w-12 text-slate-700" />
           <h3 className="text-lg font-bold text-white">Appraisal History</h3>
           <p className="text-slate-400 max-w-md">
            This asset is valued based on the latest manual appraisal recorded on {assetData.holding.valuationDate ? new Date(assetData.holding.valuationDate).toLocaleDateString() : 'N/A'}. 
            Real estate performance uses transaction history for ROI calculation.
           </p>
        </div>
      )}

      <AssetTransactionTable 
        transactions={assetData.transactions} 
        symbol={assetData.symbol}
        assetName={assetData.name}
        assetClass={assetData.assetClass}
        assetCurrency={assetData.currency}
        fxRate={fxRate}
      />
    </div>
  );
}
