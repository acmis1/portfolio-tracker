"use client"

import { useState, useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { formatVND } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import { PieChart as PieIcon, Layers, ChevronRight } from 'lucide-react'

interface AssetHolding {
  id: string;
  symbol: string;
  name: string;
  assetClass: string;
  marketValue: number;
}

interface AllocationChartProps {
  holdings: AssetHolding[];
}

const MACRO_MAPPING: Record<string, string> = {
  'INDIVIDUAL_STOCK': 'Equities',
  'ETF': 'Equities',
  'STOCK_FUND': 'Equities',
  'BOND_FUND': 'Fixed Income',
  'CASH': 'Cash & Equivalents',
  'TERM_DEPOSIT': 'Cash & Equivalents',
  'CRYPTO': 'Cryptocurrency',
  'REAL_ESTATE': 'Real Estate',
  'GOLD': 'Commodities',
};

const COLORS: Record<string, string> = {
  'Equities': '#10B981',        // Emerald
  'Fixed Income': '#3B82F6',    // Blue
  'Cryptocurrency': '#8B5CF6',  // Violet
  'Commodities': '#F59E0B',     // Amber
  'Real Estate': '#F43F5E',     // Rose
  'Cash & Equivalents': '#64748B', // Slate
  'Other': '#94a3b8'
};

const EQUITY_CLASSES = ['INDIVIDUAL_STOCK', 'ETF', 'STOCK_FUND'];
const EQUITY_COLORS = [
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#3B82F6', // Blue
  '#F43F5E', // Rose
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#94A3B8', // Slate (for Others)
];

export function AllocationChart({ holdings }: AllocationChartProps) {
  const [view, setView] = useState<'macro' | 'equity'>('macro');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const processedData = useMemo(() => {
    if (view === 'macro') {
      const macroDataMap = holdings.reduce((acc, item) => {
        const macroCategory = MACRO_MAPPING[item.assetClass] || 'Other';
        if (!acc[macroCategory]) acc[macroCategory] = 0;
        acc[macroCategory] += item.marketValue;
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(macroDataMap)
        .map(([name, value]) => ({ 
          name, 
          value,
          color: COLORS[name] || COLORS['Other']
        }))
        .filter(item => item.value > 0)
        .sort((a, b) => b.value - a.value);
    } else {
      const equityHoldings = holdings
        .filter(h => EQUITY_CLASSES.includes(h.assetClass) && h.marketValue > 0)
        .sort((a, b) => b.marketValue - a.marketValue);

      if (equityHoldings.length <= 7) {
        return equityHoldings.map((h, i) => ({
          name: h.symbol,
          value: h.marketValue,
          color: EQUITY_COLORS[i % EQUITY_COLORS.length]
        }));
      }

      // Group into Top 6 + Others
      const top6 = equityHoldings.slice(0, 6);
      const othersValue = equityHoldings.slice(6).reduce((sum, h) => sum + h.marketValue, 0);
      
      const result = top6.map((h, i) => ({
        name: h.symbol,
        value: h.marketValue,
        color: EQUITY_COLORS[i]
      }));

      result.push({
        name: 'Others',
        value: othersValue,
        color: EQUITY_COLORS[7]
      });

      return result;
    }
  }, [holdings, view]);

  const totalValue = processedData.reduce((sum, item) => sum + item.value, 0);
  const hasData = processedData.length > 0;

  return (
    <div className="w-full rounded-2xl glass-premium p-6 transition-all duration-500 border border-white/5 flex flex-col min-h-[520px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            {view === 'macro' ? <PieIcon className="h-5 w-5 text-emerald-400" /> : <Layers className="h-5 w-5 text-indigo-400" />}
            {view === 'macro' ? 'Macro Allocation' : 'Equity Mix'}
          </h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.15em] mt-1">
            {view === 'macro' ? 'Asset Class Distribution' : 'Holdings Composition'}
          </p>
        </div>

        <div className="flex p-1 bg-slate-900/80 rounded-xl border border-white/5">
          <button
            onClick={() => setView('macro')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
              view === 'macro' 
                ? "bg-white/10 text-white shadow-sm" 
                : "text-slate-500 hover:text-slate-300"
            )}
          >
            Macro
          </button>
          <button
            onClick={() => setView('equity')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
              view === 'equity' 
                ? "bg-white/10 text-white shadow-sm" 
                : "text-slate-500 hover:text-slate-300"
            )}
          >
            Equity
          </button>
        </div>
      </div>

      {!hasData ? (
        <div className="flex flex-1 flex-col items-center justify-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-white/[0.02] border border-dashed border-white/10 flex items-center justify-center">
            <PieIcon className="h-8 w-8 text-slate-700" />
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest italic">No Data to Display</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col xl:flex-row gap-10 items-center">
          {/* Chart Container */}
          <div className="relative w-full max-w-[260px] aspect-square shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={processedData}
                  cx="50%"
                  cy="50%"
                  innerRadius={75}
                  outerRadius={105}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  animationDuration={1000}
                >
                  {processedData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      style={{ 
                        filter: activeIndex === index ? `drop-shadow(0px 0px 12px ${entry.color}66)` : 'none',
                        opacity: activeIndex === null || activeIndex === index ? 1 : 0.4
                      }}
                      className="transition-all duration-300 outline-none cursor-pointer"
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const percentage = totalValue > 0 ? (payload[0].value / totalValue) * 100 : 0;
                      return (
                        <div className="rounded-xl border border-white/10 bg-slate-950/90 p-4 shadow-2xl backdrop-blur-md min-w-[160px]">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.1em] mb-2 border-b border-white/5 pb-2">
                            {payload[0].name}
                          </p>
                          <div className="space-y-1">
                            <p className="text-lg font-black text-white">{percentage.toFixed(1)}%</p>
                            <p className="text-[10px] font-bold text-slate-400">{formatVND(payload[0].value)}</p>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">
                {activeIndex !== null ? processedData[activeIndex].name : 'Total'}
              </span>
              <span className="text-xl font-black text-white tracking-tighter">
                {activeIndex !== null ? formatVND(processedData[activeIndex].value) : formatVND(totalValue)}
              </span>
              {activeIndex !== null && (
                <span className="text-[10px] font-black text-emerald-400 mt-1 animate-in fade-in slide-in-from-bottom-1">
                  {((processedData[activeIndex].value / totalValue) * 100).toFixed(1)}%
                </span>
              )}
            </div>
          </div>

          {/* Custom Legend */}
          <div className="flex-1 w-full space-y-1">
            {processedData.map((entry, index) => {
              const percentage = (entry.value / totalValue) * 100;
              return (
                <div 
                  key={entry.name}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  className={cn(
                    "flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all duration-300 group cursor-pointer",
                    activeIndex === index 
                      ? "bg-white/[0.04] border-white/10 translate-x-1" 
                      : "bg-transparent border-transparent opacity-70 hover:opacity-100"
                  )}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div 
                      className="h-1.5 w-1.5 rounded-full shrink-0 shadow-sm" 
                      style={{ backgroundColor: entry.color }}
                    />
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-[11px] font-black text-slate-200 uppercase tracking-wide truncate">
                        {entry.name}
                      </span>
                      <span className="text-[9px] font-bold text-slate-500 tabular-nums">
                        {formatVND(entry.value)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-black text-white tabular-nums">
                        {percentage.toFixed(1)}%
                      </div>
                      <div className="w-12 h-1 bg-white/5 rounded-full mt-1 overflow-hidden">
                        <div 
                          className="h-full transition-all duration-1000 ease-out"
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: entry.color
                          }}
                        />
                      </div>
                    </div>
                    <ChevronRight className={cn(
                      "h-3 w-3 text-slate-700 transition-transform duration-300",
                      activeIndex === index ? "translate-x-0.5 text-slate-400" : ""
                    )} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  )
}
