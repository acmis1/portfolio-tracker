"use client"

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { formatCurrency } from '@/lib/formatters'
import { LineChart } from 'lucide-react'

interface AssetPriceChartProps {
  prices: { date: Date; closePrice: number }[]
}

export function AssetPriceChart({ prices }: AssetPriceChartProps) {
  const hasData = prices && prices.length > 0

  const chartData = prices.map(p => ({
    date: new Date(p.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' }),
    price: p.closePrice,
    rawDate: p.date
  }))

  const formatYAxis = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
    return value.toLocaleString()
  }

  return (
    <div className="h-[400px] w-full rounded-2xl glass-premium border border-white/5 p-6 shadow-2xl overflow-hidden relative">
      <div className="mb-6">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Historical Price</h3>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center h-[280px] space-y-4">
          <div className="p-4 rounded-full bg-slate-900/50 border border-white/5">
            <LineChart className="w-8 h-8 text-slate-700" />
          </div>
          <div className="text-center">
            <p className="text-slate-400 font-bold text-sm">No pricing history tracked</p>
            <p className="text-xs text-slate-600 mt-1 max-w-[250px]">
              Historical data is not currently available for this asset class in our pipeline.
            </p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.5} />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
              dy={10}
              minTickGap={40}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
              tickFormatter={formatYAxis}
              orientation="right"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-xl border border-white/10 bg-slate-950/90 p-3 shadow-2xl backdrop-blur-xl">
                      <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                        {payload[0].payload.date}
                      </p>
                      <p className="text-sm font-black text-white">
                        {formatCurrency(payload[0].value as number)}
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorPrice)"
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
