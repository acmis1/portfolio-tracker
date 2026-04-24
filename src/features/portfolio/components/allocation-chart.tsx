"use client"

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { formatVND, formatCompactVND, formatAssetDisplay } from '@/lib/utils/format'
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
};

const DEFAULT_COLOR = '#94a3b8';

const EQUITY_CLASSES = ['INDIVIDUAL_STOCK', 'ETF', 'STOCK_FUND'];
const EQUITY_COLORS = [
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#3B82F6', // Blue
  '#F43F5E', // Rose
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#94A3B8', // Slate
];

export function AllocationChart({ holdings }: AllocationChartProps) {
  const [view, setView] = useState<'macro' | 'equity'>('macro');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const { processedData, totalValue } = useMemo(() => {
    let data: { name: string; value: number; color: string; isRemainder?: boolean }[] = [];

    if (view === 'macro') {
      const macroDataMap = holdings.reduce((acc, item) => {
        const macroCategory = MACRO_MAPPING[item.assetClass] || item.assetClass;
        if (!acc[macroCategory]) acc[macroCategory] = 0;
        acc[macroCategory] += item.marketValue;
        return acc;
      }, {} as Record<string, number>);

      data = Object.entries(macroDataMap)
        .map(([name, value]) => ({ 
          name, 
          value,
          color: COLORS[name] || DEFAULT_COLOR
        }))
        .filter(item => item.value > 0)
        .sort((a, b) => b.value - a.value);
    } else {
      const equityHoldings = holdings
        .filter(h => EQUITY_CLASSES.includes(h.assetClass) && h.marketValue > 0)
        .sort((a, b) => b.marketValue - a.marketValue);

      const top5 = equityHoldings.slice(0, 5);
      const remainingCount = Math.max(0, equityHoldings.length - 5);
      
      data = top5.map((h, i) => {
        const labels = formatAssetDisplay(h.symbol, h.name);
        return {
          name: labels.primary,
          value: h.marketValue,
          color: EQUITY_COLORS[i]
        };
      });

      if (remainingCount > 0) {
        const othersValue = equityHoldings.slice(5).reduce((sum, h) => sum + h.marketValue, 0);
        data.push({
          name: `+ ${remainingCount} more holdings`,
          value: othersValue,
          color: '#334155', // slate-700
          isRemainder: true
        });
      }
    }

    const total = data.reduce((sum, item) => sum + item.value, 0);
    return { processedData: data, totalValue: total };
  }, [holdings, view]);

  const hasData = processedData.length > 0;

  return (
    <div className="w-full rounded-2xl glass-premium p-6 border border-white/5 flex flex-col min-h-[460px] max-h-[460px] overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 shrink-0">
        <div>
          <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            {view === 'macro' ? <PieIcon className="h-5 w-5 text-emerald-400" /> : <Layers className="h-5 w-5 text-indigo-400" />}
            {view === 'macro' ? 'Allocation' : 'Equity Mix'}
          </h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.15em] mt-1">
            {view === 'macro' ? 'Portfolio Structure' : 'Top 5 Holdings'}
          </p>
        </div>

        <div className="flex p-1 bg-slate-950 rounded-xl border border-white/5 shadow-inner">
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
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest italic text-center">No Assets Detected</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-between min-h-0">
          {/* Chart Container */}
          <div className="relative w-full max-w-[180px] aspect-square shrink-0 mx-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={processedData}
                  cx="50%"
                  cy="50%"
                  innerRadius={76}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  animationDuration={800}
                >
                  {processedData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      style={{ 
                        filter: activeIndex === index ? `drop-shadow(0px 0px 8px ${entry.color}44)` : 'none',
                        opacity: activeIndex === null || activeIndex === index ? 1 : 0.3
                      }}
                      className="transition-all duration-300 outline-none cursor-pointer"
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              {activeIndex === null ? (
                <div className="animate-in fade-in duration-500">
                  <span className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-500 mb-0.5 block">
                    TOTAL
                  </span>
                  <span className="text-base font-black text-white tracking-tighter leading-none">
                    {formatCompactVND(totalValue)}
                  </span>
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-1 duration-300">
                  <span className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-400 mb-0.5 block truncate max-w-[100px] mx-auto">
                    {processedData[activeIndex].name}
                  </span>
                  <span className="text-xl font-black text-white tracking-tighter block leading-none">
                    {((processedData[activeIndex].value / totalValue) * 100).toFixed(1)}%
                  </span>
                  <span className="text-[9px] font-bold text-slate-600 mt-1 block tabular-nums">
                    {formatCompactVND(processedData[activeIndex].value)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Custom Legend */}
          <div className="w-full flex-1 flex flex-col justify-center min-h-0 pt-2 pb-2">
            <div className="space-y-0.5">
              {processedData.map((entry, index) => {
                const percentage = (entry.value / totalValue) * 100;
                return (
                  <div 
                    key={entry.name}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                    className={cn(
                      "flex items-center justify-between px-3 py-1 rounded-md transition-all duration-200 group cursor-pointer",
                      activeIndex === index 
                        ? "bg-white/[0.04] translate-x-1" 
                        : "bg-transparent opacity-80 hover:opacity-100"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div 
                        className="h-1.5 w-1.5 rounded-full shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-125"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-wider truncate transition-colors",
                        entry.isRemainder ? "text-slate-400 italic" : "text-slate-100 group-hover:text-white"
                      )}>
                        {entry.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={cn(
                        "text-[10px] font-black tabular-nums transition-colors duration-300",
                        activeIndex === index ? "text-emerald-400" : "text-slate-400"
                      )}>
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Wired CTA */}
          <div className="w-full pt-4 border-t border-white/5 shrink-0 flex justify-center">
            <Link 
              href="/holdings"
              className="group flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.25em] text-slate-500 hover:text-emerald-400 transition-all duration-300"
            >
              View Full Allocation Detail
              <ChevronRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
