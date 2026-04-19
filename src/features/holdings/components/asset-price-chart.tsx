"use client"

import { useState, useMemo } from 'react'
import {
  Area,
  AreaChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  ComposedChart,
} from 'recharts'
import { formatCurrency } from '@/lib/formatters'
import { LineChart, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AssetPriceChartProps {
  prices: { date: Date; closePrice: number }[]
}

type TimeRange = '1M' | '3M' | '6M' | '1Y' | 'ALL'

/**
 * Calculates simple moving average for a given period.
 * Assumes data is sorted ascending by date.
 */
function calculateSMA(data: { closePrice: number }[], period: number) {
  return data.map((_: any, index: number) => {
    if (index < period - 1) return null
    const slice = data.slice(index - period + 1, index + 1)
    const sum = slice.reduce((acc: number, curr: any) => acc + curr.closePrice, 0)
    return sum / period
  })
}

export function AssetPriceChart({ prices }: AssetPriceChartProps) {
  const [range, setRange] = useState<TimeRange>('3M')
  const [showSMA20, setShowSMA20] = useState(false)
  const [showSMA50, setShowSMA50] = useState(false)
  
  // Calculate SMAs on the FULL dataset first to ensure lookback is correct
  const fullPriceData = useMemo(() => {
    const sma20 = calculateSMA(prices, 20)
    const sma50 = calculateSMA(prices, 50)
    
    return prices.map((p: any, i: number) => ({
      ...p,
      sma20: sma20[i],
      sma50: sma50[i]
    }))
  }, [prices])

  const filteredPrices = useMemo(() => {
    if (!fullPriceData.length) return []
    if (range === 'ALL') return fullPriceData

    const now = new Date()
    const cutoff = new Date(now)
    
    switch (range) {
      case '1M': cutoff.setMonth(now.getMonth() - 1); break
      case '3M': cutoff.setMonth(now.getMonth() - 3); break
      case '6M': cutoff.setMonth(now.getMonth() - 6); break
      case '1Y': cutoff.setFullYear(now.getFullYear() - 1); break
    }

    return fullPriceData.filter(p => new Date(p.date) >= cutoff)
  }, [fullPriceData, range])

  const hasData = filteredPrices && filteredPrices.length > 0

  const chartData = filteredPrices.map((p: any) => ({
    date: new Date(p.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' }),
    price: p.closePrice,
    rawDate: p.date,
    sma20: p.sma20,
    sma50: p.sma50
  }))

  const formatYAxis = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
    return value.toLocaleString()
  }

  const ranges: TimeRange[] = ['1M', '3M', '6M', '1Y', 'ALL']

  return (
    <div className="h-[430px] w-full rounded-2xl glass-premium border border-white/5 p-6 shadow-2xl overflow-hidden relative">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Price Performance</h3>
          
          <div className="flex items-center gap-1.5 ml-4 border-l border-white/5 pl-4">
            <button
              onClick={() => setShowSMA20(!showSMA20)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2 py-1 text-[9px] font-bold uppercase tracking-wider transition-all",
                showSMA20 
                  ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" 
                  : "text-slate-600 border border-transparent hover:text-slate-400"
              )}
            >
              <Activity className="w-3 h-3" />
              SMA 20
            </button>
            <button
              onClick={() => setShowSMA50(!showSMA50)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2 py-1 text-[9px] font-bold uppercase tracking-wider transition-all",
                showSMA50 
                  ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" 
                  : "text-slate-600 border border-transparent hover:text-slate-400"
              )}
            >
              <Activity className="w-3 h-3" />
              SMA 50
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-slate-900/50 p-1 border border-white/5">
          {ranges.map((r: any) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "rounded-md px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all",
                range === r
                  ? "bg-slate-800 text-white shadow-xl bg-gradient-to-br from-slate-700 to-slate-800"
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center h-[250px] space-y-4">
          <div className="p-4 rounded-full bg-slate-900/50 border border-white/5">
            <LineChart className="w-8 h-8 text-slate-700" />
          </div>
          <div className="text-center px-4">
            <p className="text-slate-400 font-bold text-sm">No pricing history in this range</p>
            <p className="text-xs text-slate-600 mt-1 max-w-[250px]">
              {range === 'ALL' 
                ? "Historical data is not currently available for this asset class." 
                : "No data found for the selected time range. Try a wider window."}
            </p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
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
              hide={chartData.length < 2}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-xl border border-white/10 bg-slate-950/90 p-3 shadow-2xl backdrop-blur-xl space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-white/5 pb-1">
                        {payload[0].payload.date}
                      </p>
                      {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center justify-between gap-4">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{entry.name}</span>
                          <span className="text-xs font-black text-white">
                            {formatCurrency(entry.value as number)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                }
                return null
              }}
            />
            <Area
              name="Price"
              type="monotone"
              dataKey="price"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorPrice)"
              animationDuration={500}
            />
            {showSMA20 && (
              <Line
                name="SMA 20"
                type="monotone"
                dataKey="sma20"
                stroke="#f59e0b"
                strokeWidth={1.5}
                dot={false}
                strokeDasharray="4 4"
                animationDuration={500}
              />
            )}
            {showSMA50 && (
              <Line
                name="SMA 50"
                type="monotone"
                dataKey="sma50"
                stroke="#6366f1"
                strokeWidth={1.5}
                dot={false}
                strokeDasharray="4 4"
                animationDuration={500}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
