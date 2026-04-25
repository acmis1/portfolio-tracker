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
  ReferenceLine,
} from 'recharts'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Info, Activity } from 'lucide-react'
import { formatVND } from '@/lib/utils/format'

interface GrowthChartProps {
  data?: { 
    date: string; 
    value: number; 
    invested: number;
    netWorth: number;
    fullDate: Date;
  }[]
}

type TimeRange = '1M' | '3M' | 'YTD' | 'ALL'
type ChartMode = 'VALUE' | 'PNL' | 'RETURN'

export function GrowthChart({ data = [] }: GrowthChartProps) {
  const [range, setRange] = useState<TimeRange>('1M')
  const [mode, setMode] = useState<ChartMode>('VALUE')

  const filteredData = useMemo(() => {
    if (!data.length) return []
    
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
    
    let startDate: Date | null = null;
    
    switch (range) {
      case '1M':
        startDate = new Date(today)
        startDate.setMonth(startDate.getMonth() - 1)
        break;
      case '3M':
        startDate = new Date(today)
        startDate.setMonth(startDate.getMonth() - 3)
        break;
      case 'YTD':
        startDate = new Date(now.getFullYear(), 0, 1)
        break;
      case 'ALL':
      default:
        return data
    }
    
    return data.filter(d => new Date(d.fullDate) >= startDate!)
  }, [data, range])

  const chartData = useMemo(() => {
    return filteredData.map(d => {
      const baseValue = d.value; // Default to ASSETS
      const cost = d.invested;
      
      let displayValue = 0;
      if (mode === 'VALUE') displayValue = baseValue;
      else if (mode === 'PNL') displayValue = baseValue - cost;
      else if (mode === 'RETURN') displayValue = cost > 0 ? ((baseValue - cost) / cost) * 100 : 0;
      
      return {
        ...d,
        displayValue,
        costValue: mode === 'VALUE' ? cost : 0
      }
    })
  }, [filteredData, mode])

  const summary = useMemo(() => {
    if (chartData.length < 2) return null;
    const start = chartData[0];
    const end = chartData[chartData.length - 1];
    const absChange = end.displayValue - start.displayValue;
    const pctChange = start.displayValue !== 0 ? (absChange / Math.abs(start.displayValue)) * 100 : 0;
    
    return {
      start: start.displayValue,
      end: end.displayValue,
      absChange,
      pctChange
    }
  }, [chartData, mode])

  const hasEnoughData = chartData.length >= 2
  const hasSomeData = chartData.length >= 1

  const formatYAxis = (val: number) => {
    if (mode === 'RETURN') return `${val.toFixed(0)}%`
    if (Math.abs(val) >= 1000000000) return `${(val / 1000000000).toFixed(1)}B`
    if (Math.abs(val) >= 1000000) return `${(val / 1000000).toFixed(0)}M`
    if (Math.abs(val) >= 1000) return `${(val / 1000).toFixed(0)}K`
    return val.toLocaleString()
  }

  const ranges: TimeRange[] = ['1M', '3M', 'YTD', 'ALL']
  const modes: { label: string; value: ChartMode }[] = [
    { label: 'Value', value: 'VALUE' },
    { label: 'P&L', value: 'PNL' },
    { label: 'Simple ROI', value: 'RETURN' }
  ]

  return (
    <div className={cn(
      "w-full rounded-2xl glass-premium p-6 transition-all duration-500 border border-white/5",
      !hasSomeData ? "h-[240px]" : "min-h-[460px]"
    )}>
      {/* Header Section */}
      <div className="mb-8 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-white tracking-tight">Performance History</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.15em] mt-1">
              {mode === 'VALUE' ? 'Asset Valuation vs Cost Basis' : mode === 'PNL' ? 'Net Profit & Loss' : 'Simple ROI % (Excl. Cash)'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Mode Switcher */}
            <div className="flex p-1 bg-slate-900/80 rounded-xl border border-white/5">
              {modes.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMode(m.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                    mode === m.value 
                      ? "bg-white/10 text-white shadow-sm" 
                      : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Range Switcher */}
            <div className="flex p-1 bg-slate-900/80 rounded-xl border border-white/5">
              {ranges.map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                    range === r 
                      ? "bg-emerald-500/20 text-emerald-400" 
                      : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Compact Summary Strip */}
        {summary && (
          <div className="flex items-center gap-8 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Current</span>
              <span className="text-sm font-black text-white">
                {mode === 'RETURN' ? `${summary.end.toFixed(2)}%` : formatVND(summary.end)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                {mode === 'VALUE' ? 'Value Change' : mode === 'PNL' ? 'P&L Change' : 'ROI Change'}
              </span>
              <div className={cn(
                "flex items-center gap-1 text-sm font-black",
                summary.absChange >= 0 ? "text-emerald-400" : "text-rose-400"
              )}>
                {summary.absChange >= 0 ? '+' : ''}
                {mode === 'RETURN' ? `${summary.absChange.toFixed(2)}%` : formatVND(summary.absChange)}
                <span className="text-[10px] font-bold opacity-60 ml-0.5">
                  ({summary.pctChange >= 0 ? '+' : ''}{summary.pctChange.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chart Section */}
      {!hasSomeData ? (
        <div className="flex flex-col items-center justify-center h-[200px] border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
          <Activity className="w-8 h-8 text-slate-700 mb-3 animate-pulse" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Awaiting First Snapshot</p>
        </div>
      ) : !hasEnoughData ? (
        <div className="flex flex-col items-center justify-center h-[300px] border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
          <div className="flex flex-col items-center text-center max-w-xs gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Info className="w-6 h-6 text-blue-400/50" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-300">Collecting Data Points</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                The chart requires at least two daily snapshots to plot performance. 
                Your current valuation is <span className="text-white font-black">{formatVND(chartData[0].displayValue)}</span>.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-[320px] w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.05} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" vertical={false} opacity={0.05} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                dy={10}
                interval="preserveStartEnd"
                minTickGap={40}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                tickFormatter={formatYAxis}
                width={60}
              />
              <Tooltip
                content={({ active, payload }: any) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const val = data.displayValue;
                    const cost = data.invested;
                    
                    return (
                      <div className="rounded-xl border border-white/10 bg-slate-950/90 p-4 shadow-2xl backdrop-blur-md min-w-[200px]">
                        <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-white/5 pb-2">
                          {data.date}
                        </p>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                              {mode === 'VALUE' ? 'Portfolio Value' : mode === 'PNL' ? 'Net P&L' : 'ROI %'}
                            </span>
                            <span className="text-sm font-black text-white">
                              {mode === 'RETURN' ? `${val.toFixed(2)}%` : formatVND(val)}
                            </span>
                          </div>
                          
                          {mode === 'VALUE' && (
                            <div className="flex items-center justify-between gap-4 border-t border-white/5 pt-2">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Cost Basis</span>
                              <span className="text-xs font-bold text-indigo-300">{formatVND(cost)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              
              {mode === 'PNL' && <ReferenceLine y={0} stroke="#ffffff" strokeOpacity={0.2} strokeDasharray="3 3" />}
              
              {mode === 'VALUE' && (
                <Area
                  type="monotone"
                  dataKey="costValue"
                  stroke="#6366f1"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#colorInvested)"
                  animationDuration={1000}
                />
              )}
              
              <Area
                type="monotone"
                dataKey="displayValue"
                stroke={mode === 'PNL' && summary?.absChange && summary.absChange < 0 ? "#f43f5e" : "#10b981"}
                strokeWidth={3}
                fillOpacity={1}
                fill={mode === 'PNL' && summary?.absChange && summary.absChange < 0 ? "url(#colorNegative)" : "url(#colorValue)"}
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
