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
import { TrendingUp, Camera, Check, Loader2 } from 'lucide-react'
import { forcePortfolioSnapshot } from '../actions/rebalancing'
import { useRouter } from 'next/navigation'

interface GrowthChartProps {
  data?: { 
    date: string; 
    value: number; 
    invested?: number;
    marketValue?: number;
  }[]
}

type TimeRange = '7D' | '1M' | '3M' | 'YTD' | 'ALL'

export function GrowthChart({ data = [] }: GrowthChartProps) {
  const [range, setRange] = useState<TimeRange>('1M')
  const [isCapturing, setIsCapturing] = useState(false)
  const [hasCaptured, setHasCaptured] = useState(false)
  const router = useRouter()

  const handleCapture = async () => {
    setIsCapturing(true)
    try {
      const res = await forcePortfolioSnapshot()
      if (res.success) {
        setHasCaptured(true)
        router.refresh()
        setTimeout(() => setHasCaptured(false), 3000)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsCapturing(false)
    }
  }

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
          // Simplistic matching for now, would ideally check fullDate
          return true
        })
      }
      case 'ALL':
      default:
        return data
    }
  }, [data, range])

  const hasData = filteredData && filteredData.length >= 2 && filteredData.some(d => d.value > 0)

  const formatYAxis = (value: number) => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`
    if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`
    return value.toLocaleString()
  }

  const ranges: TimeRange[] = ['7D', '1M', '3M', 'YTD', 'ALL']

  return (
    <div className="h-[350px] w-full rounded-2xl glass-premium p-6 glow-card">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Portfolio Performance</h3>
            <p className="text-xs text-slate-400">Total valuation vs. Net Invested capital</p>
          </div>
          <button
            onClick={handleCapture}
            disabled={isCapturing || hasCaptured}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-300",
              hasCaptured 
                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-500" 
                : "border-white/5 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
            )}
            title="Capture Snapshot"
          >
            {isCapturing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : hasCaptured ? (
              <Check className="h-4 w-4" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </button>
        </div>
        
        <div className="flex items-center gap-1 rounded-lg bg-slate-900/50 p-1 border border-white/5">
          {ranges.map((r: any) => (
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
          <p className="text-slate-400 font-medium">Accumulating historical data...</p>
          <p className="text-xs text-slate-500">The chart will appear once at least 2 daily snapshots are captured.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="80%">
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.5} />
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
                  const total = payload.find(p => p.dataKey === 'value')?.value as number || 0;
                  const invested = payload.find(p => p.dataKey === 'invested')?.value as number || 0;
                  const delta = total - invested;
                  const isPositive = delta >= 0;

                  return (
                    <div className="rounded-lg border border-white/10 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-xl min-w-[200px]">
                      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-white/5 pb-2">
                        {payload[0].payload.date}
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Value</span>
                          <span className="text-sm font-black text-white">{new Intl.NumberFormat('vi-VN').format(total)} ₫</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Net Invested</span>
                          <span className="text-xs font-bold text-indigo-300">{new Intl.NumberFormat('vi-VN').format(invested)} ₫</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 pt-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Growth P&L</span>
                          <span className={cn(
                            "text-sm font-black",
                            isPositive ? "text-emerald-400" : "text-red-400"
                          )}>
                            {isPositive ? '+' : ''}{new Intl.NumberFormat('vi-VN').format(delta)} ₫
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <Area
              type="monotone"
              dataKey="invested"
              stroke="#6366f1"
              strokeWidth={2}
              strokeDasharray="5 5"
              fillOpacity={1}
              fill="url(#colorInvested)"
              animationDuration={1500}
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
