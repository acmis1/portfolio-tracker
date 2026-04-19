"use client"

import { formatDistanceToNow } from 'date-fns'
import { PieChart, Globe, Database } from 'lucide-react'
import { TransactionModal } from '@/features/transactions/components/transaction-modal'
import Link from 'next/link'
import { formatCurrency } from '@/lib/formatters'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { UserButton } from "@clerk/nextjs"

interface NavigationProps {
  fxRate: number;
  lastSync: Date | null;
}

export function Navigation({ fxRate, lastSync }: NavigationProps) {
  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/5">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-4">
        {/* Left: Logo and Title */}
        <Link href="/" className="flex items-center gap-3 group cursor-pointer">
          <div className="rounded-xl bg-emerald-500 p-2 shadow-lg shadow-emerald-500/20 transition-transform group-hover:scale-110">
            <PieChart className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-black tracking-tighter text-white">
            AEGIS<span className="text-emerald-500">.</span>LEDGER
          </span>
        </Link>

        {/* Right: User Avatar / Actions */}
        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-6 border-r border-white/10 pr-6">
            <Link href="/" className="text-sm font-bold text-white hover:text-emerald-400 cursor-pointer transition-colors">Dashboard</Link>
            <Link href="/holdings" className="text-sm font-bold text-white hover:text-emerald-400 cursor-pointer transition-colors">Holdings</Link>
            <Link href="/rebalance" className="text-sm font-bold text-white hover:text-emerald-400 cursor-pointer transition-colors">Rebalance</Link>
            <Link href="/income" className="text-sm font-bold text-white hover:text-emerald-400 cursor-pointer transition-colors">Income</Link>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Database Sync Status */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2.5 cursor-help py-1">
                  <div className={cn(
                    "h-2 w-2 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]",
                    lastSync ? "bg-emerald-500" : "bg-amber-500"
                  )} />
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5",
                    lastSync ? "text-emerald-500/80" : "text-amber-500/80"
                  )}>
                    <span className="opacity-50">Data Sync</span>
                    <span>{lastSync ? formatDistanceToNow(new Date(lastSync), { addSuffix: true }) : 'Never'}</span>
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="glass-premium border-white/10">
                <p className="text-xs font-medium">Last successful price update from providers</p>
              </TooltipContent>
            </Tooltip>

            {/* Live FX Badge */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10 cursor-help group transition-colors hover:bg-emerald-500/10 active:scale-95">
                  <Globe className="h-3.5 w-3.5 text-emerald-500" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60 leading-tight">Live USD/VND</span>
                    <span className="text-xs font-bold text-white tabular-nums leading-tight">
                      {formatCurrency(fxRate, 'VND')}
                    </span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent className="glass-premium border-white/10">
                <p className="text-xs font-medium">Auto-synced from global market data</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <TransactionModal fxRate={fxRate} />

          <UserButton 
            appearance={{
              elements: {
                avatarBox: "h-10 w-10 border border-white/10 hover:border-emerald-500/50 transition-colors"
              }
            }}
          />
        </div>
      </div>
    </nav>
  )
}
