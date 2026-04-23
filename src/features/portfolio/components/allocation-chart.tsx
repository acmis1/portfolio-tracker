"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { formatVND } from '@/lib/utils/format'

interface AllocationChartProps {
  data: { name: string; value: number }[]
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

export function AllocationChart({ data }: AllocationChartProps) {
  // 1. Aggregate granular asset classes into Macro Categories
  const aggregatedDataMap = data.reduce((acc, item) => {
    const macroCategory = MACRO_MAPPING[item.name] || 'Other';
    if (!acc[macroCategory]) {
      acc[macroCategory] = 0;
    }
    acc[macroCategory] += item.value;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(aggregatedDataMap)
    .map(([name, value]) => ({ 
      name, 
      value,
      color: COLORS[name] || COLORS['Other']
    }))
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);

  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);
  const hasData = chartData.length > 0;

  return (
    <div className="h-full min-h-[400px] w-full rounded-2xl glass-premium p-6 glow-card flex flex-col">
      <div className="mb-2">
        <h3 className="text-lg font-bold text-white tracking-tight">Macro Allocation</h3>
        <p className="text-xs text-slate-400 font-medium">Aggregated portfolio distribution</p>
      </div>

      {!hasData ? (
        <div className="flex flex-1 flex-col items-center justify-center space-y-2 pb-10">
          <div className="h-20 w-20 rounded-full border-4 border-slate-800 border-t-emerald-500/20" />
          <p className="text-sm font-medium text-slate-500">No data available</p>
        </div>
      ) : (
        <div className="flex-1 w-full min-h-[300px]">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={85}
                paddingAngle={8}
                dataKey="value"
                stroke="none"
                label={false}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color} 
                    style={{ filter: 'drop-shadow(0px 4px 12px rgba(0,0,0,0.5))' }}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }: any) => {
                  if (active && payload && payload.length) {
                    const percentage = totalValue > 0 ? (payload[0].value / totalValue) * 100 : 0;
                    return (
                      <div className="rounded-xl border border-white/10 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-xl min-w-[160px]">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          {payload[0].name}
                        </p>
                        <div className="flex items-baseline gap-2">
                          <p className="text-lg font-black text-white">
                            {percentage.toFixed(1)}%
                          </p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase">
                            Weight
                          </p>
                        </div>
                        <div className="mt-2 pt-2 border-t border-white/5 text-[10px] font-medium text-slate-400">
                          Value: {formatVND(payload[0].value)}
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={48} 
                iconType="circle" 
                formatter={(value) => (
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">
                    {value}
                  </span>
                )}
                wrapperStyle={{ 
                  paddingTop: '30px'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
