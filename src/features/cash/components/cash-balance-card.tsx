import { Wallet } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { getCashBalance } from '../actions'
import { formatCurrency } from '@/lib/formatters'

export async function CashBalanceCard() {
  const balance = await getCashBalance()

  return (
    <Card className="glass-premium hover-lift relative overflow-hidden transition-all duration-300">
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-amber-500/10 blur-3xl" />
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription className="text-slate-400 font-medium tracking-wide uppercase text-xs">
            Unallocated Cash
          </CardDescription>
          <Wallet className="h-4 w-4 text-amber-500/50" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 text-4xl font-black tracking-tight text-white glow-amber">
          {formatCurrency(balance)}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">
            Available for deployment
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
