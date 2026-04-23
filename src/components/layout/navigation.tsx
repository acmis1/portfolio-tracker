"use client"

import { formatDistanceToNow } from 'date-fns'
import { PieChart, Globe, Database } from 'lucide-react'
import { TransactionModal } from '@/features/transactions/components/transaction-modal'
import Link from 'next/link'
import { formatCurrency } from '@/lib/formatters'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { UserButton } from "@clerk/nextjs"

export function Navigation() {
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
          <div className="hidden lg:flex items-center gap-6 border-white/10 pr-6">
            <Link href="/" className="text-sm font-bold text-white hover:text-emerald-400 cursor-pointer transition-colors border-r border-white/10 pr-6">Dashboard</Link>
            <Link href="/holdings" className="text-sm font-bold text-white hover:text-emerald-400 cursor-pointer transition-colors border-r border-white/10 pr-6">Holdings</Link>
            <Link href="/rebalance" className="text-sm font-bold text-white hover:text-emerald-400 cursor-pointer transition-colors pr-6">Rebalance</Link>
          </div>
          
          <TransactionModal />

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
