"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const DATA = [
  { name: 'Stocks', value: 45, color: '#10b981' }, // emerald-500
  { name: 'Crypto', value: 25, color: '#3b82f6' }, // blue-500
  { name: 'Mutual Funds', value: 30, color: '#8b5cf6' }, // violet-500
]

export function AllocationChart() {
  return (
    <div className="h-[350px] w-full rounded-2xl glass-premium p-6 glow-card">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-white">Asset Allocation</h3>
        <p className="text-xs text-slate-400">Portfolio distribution by class</p>
      </div>
      <div className="flex h-full items-center">
        <div className="h-[220px] flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={DATA}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={85}
                paddingAngle={8}
                dataKey="value"
                stroke="none"
              >
                {DATA.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color} 
                    style={{ filter: 'drop-shadow(0px 0px 4px rgba(0,0,0,0.5))' }}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border border-white/10 bg-slate-900/90 p-2 shadow-2xl backdrop-blur-md">
                        <p className="text-xs font-bold text-white uppercase tracking-wider">
                          {payload[0].name}
                        </p>
                        <p className="text-sm font-black text-emerald-400">
                          {payload[0].value}%
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
          {DATA.map((item) => (
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
              <p className="pl-4 text-sm font-black text-white">{item.value}%</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
