"use client"

import { TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function OverviewCards() {
  // Format currency with VND suffix
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Card 1: Total Net Worth */}
      <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <CardHeader className="pb-2">
          <CardDescription className="text-slate-600 dark:text-slate-400">
            Total Net Worth
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-2 text-3xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(1450000000)}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 dark:bg-emerald-950">
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                +2.4%
              </span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              this week
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Portfolio XIRR */}
      <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <CardHeader className="pb-2">
          <CardDescription className="text-slate-600 dark:text-slate-400">
            Portfolio XIRR
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-2 text-3xl font-bold text-slate-900 dark:text-white">
            +14.2%
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="success">
              Positive Return
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Active Assets */}
      <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <CardHeader className="pb-2">
          <CardDescription className="text-slate-600 dark:text-slate-400">
            Active Assets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-2 text-3xl font-bold text-slate-900 dark:text-white">
            8
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            across 3 classes
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
