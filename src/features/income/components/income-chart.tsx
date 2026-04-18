"use client"

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts'
import { TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/formatters'

interface IncomeChartProps {
  data: {
    name: string;
    dividend: number;
    interest: number;
    total: number;
  }[]
}

export function IncomeChart({ data }: IncomeChartProps) {
  const hasData = data && data.length > 0 && data.some(d => d.total > 0)

  const formatYAxis = (value: number) => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`
    if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`
    return value.toLocaleString()
  }

  return (
    <div className="h-[400px] w-full rounded-2xl glass-premium p-6 glow-card">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-white tracking-tight">Income Distribution</h3>
        <p className="text-xs text-slate-400">Monthly dividends and interest yield</p>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-50">
          <TrendingUp className="w-12 h-12 text-slate-700" />
          <p className="text-slate-400 font-medium">No income history found</p>
          <p className="text-xs text-slate-500">Add dividend or interest transactions to see the distribution.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="80%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.5} />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 10 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickFormatter={formatYAxis}
              width={45}
            />
            <Tooltip
              cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const dividend = payload.find(p => p.dataKey === 'dividend')?.value as number || 0;
                  const interest = payload.find(p => p.dataKey === 'interest')?.value as number || 0;
                  const total = dividend + interest;

                  return (
                    <div className="rounded-lg border border-white/10 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-xl min-w-[200px]">
                      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-white/5 pb-2">
                        {payload[0].payload.name}
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Dividends</span>
                          <span className="text-sm font-black text-white">{formatCurrency(dividend)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-2">
                          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Interest</span>
                          <span className="text-sm font-black text-white">{formatCurrency(interest)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 pt-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Monthly</span>
                          <span className="text-sm font-black text-white">
                            {formatCurrency(total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <Legend 
              verticalAlign="top" 
              align="right" 
              iconType="circle"
              wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 'bold' }}
            />
            <Bar 
              dataKey="dividend" 
              name="Dividends" 
              stackId="a" 
              fill="#10b981" 
              radius={[0, 0, 0, 0]} 
              barSize={32}
            />
            <Bar 
              dataKey="interest" 
              name="Interest" 
              stackId="a" 
              fill="#3b82f6" 
              radius={[4, 4, 0, 0]} 
              barSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
