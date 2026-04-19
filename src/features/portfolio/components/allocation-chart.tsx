"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface AllocationChartProps {
  data: { name: string; value: number; color: string }[]
}

export function AllocationChart({ data }: AllocationChartProps) {
  const hasData = data && data.length > 0;

  return (
    <div className="h-[350px] w-full rounded-2xl glass-premium p-6 glow-card">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-white">Asset Allocation</h3>
        <p className="text-xs text-slate-400">Portfolio distribution by class</p>
      </div>

      {!hasData ? (
        <div className="flex h-full flex-col items-center justify-center space-y-2 pb-10">
          <div className="h-20 w-20 rounded-full border-4 border-slate-800 border-t-emerald-500/20" />
          <p className="text-sm font-medium text-slate-500">No data available</p>
        </div>
      ) : (
        <div className="flex h-full items-center">
          <div className="h-[220px] flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry: any, index: number) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      style={{ filter: 'drop-shadow(0px 0px 4px rgba(0,0,0,0.5))' }}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border border-white/10 bg-slate-900/90 p-2 shadow-2xl backdrop-blur-md">
                          <p className="text-xs font-bold text-white uppercase tracking-wider">
                            {payload[0].name}
                          </p>
                          <p className="text-sm font-black text-emerald-400">
                            {Number(payload[0].value).toFixed(1)}%
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-[140px] space-y-3 pl-4">
            {data.map((item: any) => (
              <div key={item.name} className="space-y-1">
                <div className="flex items-center gap-2">
                  <div 
                    className="h-2 w-2 rounded-full" 
                    style={{ backgroundColor: item.color }} 
                  />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {item.name}
                  </span>
                </div>
                <p className="pl-4 text-sm font-black text-white">{Number(item.value).toFixed(1)}%</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
