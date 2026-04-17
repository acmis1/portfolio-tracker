"use client"

import { PieChart } from 'lucide-react'

export function Navigation() {
  return (
    <nav className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left: Logo and Title */}
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-slate-900 p-2 dark:bg-slate-50">
            <PieChart className="h-5 w-5 text-white dark:text-slate-900" />
          </div>
          <span className="text-lg font-semibold text-slate-900 dark:text-white">
            Portfolio
          </span>
        </div>

        {/* Right: User Avatar */}
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-sm font-semibold text-white">JD</span>
          </div>
        </div>
      </div>
    </nav>
  )
}
