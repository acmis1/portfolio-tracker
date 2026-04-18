"use client"

import { useState, useMemo } from 'react'
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { cn } from '@/lib/utils'
import { TrendingUp } from 'lucide-react'

interface GrowthChartProps {
  data?: { date: string; value: number }[]
}

type TimeRange = '7D' | '1M' | '3M' | 'YTD' | 'ALL'

export function GrowthChart({ data = [] }: GrowthChartProps) {
  const [range, setRange] = useState<TimeRange>('1M')

  const filteredData = useMemo(() => {
    if (!data.length) return []
    
    switch (range) {
      case '7D':
        return data.slice(-7)
      case '1M':
        return data.slice(-30)
      case '3M':
        return data.slice(-90)
      case 'YTD': {
        const currentYear = new Date().getFullYear()
        return data.filter(d => {
          const date = new Date(d.date + ', ' + currentYear)
          return date.getFullYear() === currentYear
        })
      }
      case 'ALL':
      default:
        return data
    }
  }, [data, range])

  const hasData = filteredData && filteredData.length > 0 && filteredData.some(d => d.value > 0)

  const formatYAxis = (value: number) => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`
    if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`
    return value.toLocaleString()
  }

  const ranges: TimeRange[] = ['7D', '1M', '3M', 'YTD', 'ALL']

  return (
    <div className="h-[350px] w-full rounded-2xl glass-premium p-6 glow-card">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Portfolio Growth</h3>
          <p className="text-xs text-slate-400">Total valuation over time (VND)</p>
        </div>
        
        <div className="flex items-center gap-1 rounded-lg bg-slate-900/50 p-1 border border-white/5">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "rounded-md px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all",
                range === r
                  ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20"
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-50">
          <TrendingUp className="w-12 h-12 text-slate-700" />
          <p className="text-slate-400 font-medium">No historical data available</p>
          <p className="text-xs text-slate-500">Record your first transaction to see growth over time</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="80%">
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 10 }}
              dy={10}
              interval="preserveStartEnd"
              minTickGap={30}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickFormatter={formatYAxis}
              width={45}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border border-white/10 bg-slate-900/90 p-3 shadow-2xl backdrop-blur-md">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {payload[0].payload.date}
                      </p>
                      <p className="text-sm font-black text-white">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                          maximumFractionDigits: 0,
                        }).format(payload[0].value as number)}
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#10b981"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorValue)"
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
