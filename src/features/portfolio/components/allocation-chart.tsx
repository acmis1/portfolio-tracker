"use client"

import { useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { formatVND } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import { PieChart as PieIcon, Layers } from 'lucide-react'

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
  'Equities': '#10B981',
  'Fixed Income': '#3B82F6',
  'Cryptocurrency': '#8B5CF6',
  'Commodities': '#F59E0B',
  'Real Estate': '#F43F5E',
  'Cash & Equivalents': '#64748B',
  'Other': '#94a3b8'
};

const EQUITY_CLASSES = ['INDIVIDUAL_STOCK', 'ETF', 'STOCK_FUND'];
const EQUITY_COLORS = ['#10B981', '#34D399', '#059669', '#6EE7B7', '#065F46', '#A7F3D0'];

export function AllocationChart({ holdings }: AllocationChartProps) {
  const [view, setView] = useState<'macro' | 'equity'>('macro');

  // 1. Process Macro Data
  const macroDataMap = holdings.reduce((acc, item) => {
    const macroCategory = MACRO_MAPPING[item.assetClass] || 'Other';
    if (!acc[macroCategory]) acc[macroCategory] = 0;
    acc[macroCategory] += item.marketValue;
    return acc;
  }, {} as Record<string, number>);

  const macroChartData = Object.entries(macroDataMap)
    .map(([name, value]) => ({ 
      name, 
      value,
      color: COLORS[name] || COLORS['Other']
    }))
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);

  // 2. Process Equity Mix Data
  const equityHoldings = holdings
    .filter(h => EQUITY_CLASSES.includes(h.assetClass) && h.marketValue > 0)
    .sort((a, b) => b.marketValue - a.marketValue);

  const equityChartData = equityHoldings.map((h, i) => ({
    name: h.symbol,
    value: h.marketValue,
    color: EQUITY_COLORS[i % EQUITY_COLORS.length]
  }));

  const chartData = view === 'macro' ? macroChartData : equityChartData;
  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);
  const hasData = chartData.length > 0;

  return (
    <div className="h-full min-h-[440px] w-full rounded-2xl glass-premium p-6 glow-card flex flex-col transition-all duration-500">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            {view === 'macro' ? 'Macro Allocation' : 'Equity Mix'}
          </h3>
          <p className="text-xs text-slate-400 font-medium">
            {view === 'macro' ? 'Aggregated portfolio distribution' : 'Stock & Fund sub-composition'}
          </p>
        </div>

        <div className="flex p-1 bg-white/5 rounded-xl border border-white/5">
          <button
            onClick={() => setView('macro')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
              view === 'macro' 
                ? "bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]" 
                : "text-slate-500 hover:text-slate-300"
            )}
          >
            <PieIcon className="h-3 w-3" />
            Macro
          </button>
          <button
            onClick={() => setView('equity')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
              view === 'equity' 
                ? "bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]" 
                : "text-slate-500 hover:text-slate-300"
            )}
          >
            <Layers className="h-3 w-3" />
            Equity
          </button>
        </div>
      </div>

      {!hasData ? (
        <div className="flex flex-1 flex-col items-center justify-center space-y-4 pb-10">
          <div className="relative">
            <div className="h-20 w-20 rounded-full border-4 border-slate-800 border-t-emerald-500/20 animate-spin-slow" />
            <div className="absolute inset-0 flex items-center justify-center">
              <PieIcon className="h-8 w-8 text-slate-700" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-slate-500 italic">No assets found</p>
            <p className="text-[10px] text-slate-600 font-medium uppercase tracking-widest mt-1">
              {view === 'equity' ? 'Add stocks or ETFs to see mix' : 'Record transactions to begin'}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 w-full min-h-[300px]">
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={95}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
                label={false}
                animationDuration={1000}
                animationBegin={0}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color} 
                    className="hover:opacity-80 transition-opacity cursor-pointer outline-none"
                    style={{ filter: 'drop-shadow(0px 4px 12px rgba(0,0,0,0.3))' }}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }: any) => {
                  if (active && payload && payload.length) {
                    const percentage = totalValue > 0 ? (payload[0].value / totalValue) * 100 : 0;
                    return (
                      <div className="rounded-xl border border-white/10 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-xl min-w-[160px] animate-in fade-in zoom-in duration-200">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          {payload[0].name}
                        </p>
                        <div className="flex items-baseline gap-2">
                          <p className="text-xl font-black text-white">
                            {percentage.toFixed(1)}%
                          </p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase">
                            Weight
                          </p>
                        </div>
                        <div className="mt-2 pt-2 border-t border-white/5 text-[10px] font-medium text-slate-400 flex justify-between">
                          <span>Value:</span>
                          <span className="font-bold text-slate-300">{formatVND(payload[0].value)}</span>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={60} 
                iconType="circle" 
                formatter={(value) => (
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 ml-1 hover:text-slate-300 transition-colors">
                    {value}
                  </span>
                )}
                wrapperStyle={{ 
                  paddingTop: '20px'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
