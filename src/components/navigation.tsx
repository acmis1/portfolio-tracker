"use client"

import { PieChart, User } from 'lucide-react'
import { TransactionModal } from './transaction-modal'

export function Navigation() {
  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/5">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-4">
        {/* Left: Logo and Title */}
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="rounded-xl bg-emerald-500 p-2 shadow-lg shadow-emerald-500/20 transition-transform group-hover:scale-110">
            <PieChart className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-black tracking-tighter text-white">
            ANTIGRAVITY<span className="text-emerald-500">.</span>CAPITAL
          </span>
        </div>

        {/* Right: User Avatar / Actions */}
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6 border-r border-white/10 pr-6">
            <span className="text-sm font-bold text-white hover:text-emerald-400 cursor-pointer transition-colors">Insights</span>
            <span className="text-sm font-bold text-white hover:text-emerald-400 cursor-pointer transition-colors">Assets</span>
            <span className="text-sm font-bold text-white hover:text-emerald-400 cursor-pointer transition-colors">Reports</span>
          </div>
          
          <TransactionModal />

          <div className="h-10 w-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center cursor-pointer hover:border-emerald-500/50 transition-colors">
            <User className="h-5 w-5 text-slate-400" />
          </div>
        </div>
      </div>
    </nav>
  )
}
