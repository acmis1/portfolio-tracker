"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface AllocationChartProps {
  data: { name: string; value: number; color: string }[]
}

export function AllocationChart({ data }: AllocationChartProps) {
  const hasData = data && data.length > 0;

  return (
    <div className="h-full min-h-[400px] w-full rounded-2xl glass-premium p-6 glow-card flex flex-col">
      <div className="mb-2">
        <h3 className="text-lg font-bold text-white">Asset Allocation</h3>
        <p className="text-xs text-slate-400">Portfolio distribution by class</p>
      </div>

      {!hasData ? (
        <div className="flex flex-1 flex-col items-center justify-center space-y-2 pb-10">
          <div className="h-20 w-20 rounded-full border-4 border-slate-800 border-t-emerald-500/20" />
          <p className="text-sm font-medium text-slate-500">No data available</p>
        </div>
      ) : (
        <div className="flex-1 w-full min-h-[300px]">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={80}
                paddingAngle={8}
                dataKey="value"
                stroke="none"
                label={false}
              >
                {data.map((entry: any, index: number) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color} 
                    style={{ filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.3))' }}
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
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="circle" 
                wrapperStyle={{ 
                  fontSize: '12px', 
                  paddingTop: '20px',
                  color: '#94a3b8' 
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
