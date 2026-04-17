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

const MOCK_DATA = [
  { date: '2025-10', value: 850000000 },
  { date: '2025-11', value: 920000000 },
  { date: '2025-12', value: 1050000000 },
  { date: '2026-01', value: 1180000000 },
  { date: '2026-02', value: 1250000000 },
  { date: '2026-03', value: 1380000000 },
  { date: '2026-04', value: 1450000000 },
]

export function GrowthChart() {
  const formatYAxis = (value: number) => {
    return `${(value / 1000000).toLocaleString()}M`
  }

  return (
    <div className="h-[350px] w-full rounded-2xl glass-premium p-6 glow-card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Portfolio Growth</h3>
          <p className="text-xs text-slate-400">Total valuation over time (VND)</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={MOCK_DATA}>
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
            tick={{ fill: '#64748b', fontSize: 11 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickFormatter={formatYAxis}
            width={60}
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
    </div>
  )
}
