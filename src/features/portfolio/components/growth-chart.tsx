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
import { TrendingUp, TrendingDown, Info, PieChart, Activity } from 'lucide-react'
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

type TimeRange = '7D' | '1M' | '3M' | 'YTD' | 'ALL'
type ChartMode = 'VALUE' | 'PNL' | 'RETURN'
type ChartMetric = 'ASSETS' | 'NET_WORTH'

export function GrowthChart({ data = [] }: GrowthChartProps) {
  const [range, setRange] = useState<TimeRange>('1M')
  const [mode, setMode] = useState<ChartMode>('VALUE')
  const [metric, setMetric] = useState<ChartMetric>('ASSETS')

  const filteredData = useMemo(() => {
    if (!data.length) return []
    
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
    
    let startDate: Date | null = null;
    
    switch (range) {
      case '7D':
        startDate = new Date(today)
        startDate.setDate(startDate.getDate() - 7)
        break;
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
      const baseValue = metric === 'ASSETS' ? d.value : d.netWorth;
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
  }, [filteredData, mode, metric])

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
    if (mode === 'RETURN') return `${val.toFixed(1)}%`
    if (Math.abs(val) >= 1000000000) return `${(val / 1000000000).toFixed(1)}B`
    if (Math.abs(val) >= 1000000) return `${(val / 1000000).toFixed(0)}M`
    return val.toLocaleString()
  }

  const ranges: TimeRange[] = ['7D', '1M', '3M', 'YTD', 'ALL']

  return (
    <div className={cn(
      "w-full rounded-2xl glass-premium p-6 glow-card transition-all duration-500",
      !hasSomeData ? "h-[200px]" : "min-h-[400px]"
    )}>
      {/* Header Section */}
      <div className="mb-6 space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white tracking-tight">Performance History</h3>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500">Live Analytics</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              {metric === 'ASSETS' ? 'Asset market value vs cost basis' : 'Total net worth progression'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Metric Selector */}
            <div className="flex items-center gap-1 rounded-lg bg-slate-900/50 p-1 border border-white/5">
              {(['ASSETS', 'NET_WORTH'] as ChartMetric[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMetric(m)}
                  className={cn(
                    "rounded-md px-2 py-1 text-[9px] font-bold uppercase tracking-wider transition-all",
                    metric === m ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "text-slate-500 hover:text-slate-400"
                  )}
                >
                  {m.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Mode Selector */}
            <div className="flex items-center gap-1 rounded-lg bg-slate-900/50 p-1 border border-white/5">
              {(['VALUE', 'PNL', 'RETURN'] as ChartMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  disabled={metric === 'NET_WORTH' && m !== 'VALUE'}
                  className={cn(
                    "rounded-md px-2 py-1 text-[9px] font-bold uppercase tracking-wider transition-all",
                    mode === m ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "text-slate-500 hover:text-slate-400",
                    metric === 'NET_WORTH' && m !== 'VALUE' && "opacity-20 cursor-not-allowed"
                  )}
                >
                  {m === 'RETURN' ? 'ROI %' : m}
                </button>
              ))}
            </div>

            {/* Range Selector */}
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
        </div>

        {/* Period Summary */}
        {summary && (
          <div className="flex flex-wrap items-center gap-x-10 gap-y-4 rounded-xl bg-white/5 p-4 border border-white/5">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Period Open</span>
              <span className="text-sm font-black text-slate-300">
                {mode === 'RETURN' ? `${summary.start.toFixed(2)}%` : formatVND(summary.start)}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Current Value</span>
              <span className="text-sm font-black text-white">
                {mode === 'RETURN' ? `${summary.end.toFixed(2)}%` : formatVND(summary.end)}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Net Change</span>
              <div className={cn(
                "flex items-center gap-1.5 text-sm font-black",
                summary.absChange >= 0 ? "text-emerald-400" : "text-rose-400"
              )}>
                {summary.absChange >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {mode === 'RETURN' 
                  ? `${(summary.absChange).toFixed(2)}%` 
                  : formatVND(summary.absChange)
                }
                <span className="text-[10px] opacity-70 font-bold ml-1">
                  ({summary.pctChange >= 0 ? '+' : ''}{summary.pctChange.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chart Section */}
      {!hasSomeData ? (
        <div className="flex flex-col items-center justify-center h-[200px] gap-4">
          <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <Activity className="w-6 h-6 text-emerald-500/50" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-slate-200 font-bold text-sm">Systemizing history...</p>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
              Snapshots are captured automatically. Data will appear once your first positions are logged.
            </p>
          </div>
        </div>
      ) : !hasEnoughData ? (
        <div className="flex flex-col items-center justify-center h-[250px] gap-6 bg-white/2 rounded-xl border border-dashed border-white/10">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Info className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-slate-200 font-bold text-sm">Waiting for second snapshot</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                Daily capture in progress
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full max-w-sm px-6">
            <div className="p-3 rounded-lg bg-white/5 border border-white/5">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Latest Point</span>
              <span className="text-xs font-black text-white">{formatVND(chartData[0].displayValue)}</span>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/5">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Status</span>
              <span className="text-[10px] font-black text-emerald-400 uppercase">Live</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={mode === 'PNL' && summary?.absChange && summary.absChange < 0 ? "#f43f5e" : "#10b981"} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={mode === 'PNL' && summary?.absChange && summary.absChange < 0 ? "#f43f5e" : "#10b981"} stopOpacity={0} />
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
                content={({ active, payload }: any) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const val = data.displayValue;
                    const cost = data.invested;
                    
                    return (
                      <div className="rounded-lg border border-white/10 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-xl min-w-[220px]">
                        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-white/5 pb-2">
                          {data.date}
                        </p>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {mode === 'VALUE' ? (metric === 'ASSETS' ? 'Asset Value' : 'Net Worth') : mode}
                            </span>
                            <span className="text-sm font-black text-white">
                              {mode === 'RETURN' ? `${val.toFixed(2)}%` : formatVND(val)}
                            </span>
                          </div>
                          
                          {mode === 'VALUE' && (
                            <div className="flex items-center justify-between gap-4 border-t border-white/5 pt-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cost Basis</span>
                              <span className="text-xs font-bold text-indigo-300">{formatVND(cost)}</span>
                            </div>
                          )}

                          {mode === 'VALUE' && metric === 'ASSETS' && (
                            <div className="flex items-center justify-between gap-4 border-t border-white/5 pt-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">P&L</span>
                              <span className={cn(
                                "text-xs font-bold",
                                (val - cost) >= 0 ? "text-emerald-400" : "text-rose-400"
                              )}>
                                {val - cost >= 0 ? '+' : ''}{formatVND(val - cost)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              
              {mode === 'PNL' && <ReferenceLine y={0} stroke="#475569" strokeDasharray="3 3" />}
              
              {mode === 'VALUE' && metric === 'ASSETS' && (
                <Area
                  type="monotone"
                  dataKey="costValue"
                  stroke="#6366f1"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fillOpacity={1}
                  fill="url(#colorInvested)"
                  animationDuration={1500}
                />
              )}
              
              <Area
                type="monotone"
                dataKey="displayValue"
                stroke={mode === 'PNL' && summary?.absChange && summary.absChange < 0 ? "#f43f5e" : "#10b981"}
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorValue)"
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
