'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Settings2, Target, Percent, AlertCircle } from 'lucide-react'
import { upsertTargetAllocation, deleteTargetAllocation, type TargetAllocationInput } from '../actions/allocations'
import { formatPercentage } from '@/lib/formatters'
import { cn } from '@/lib/utils'

interface ConfigureTargetsModalProps {
  initialTargets: any[]
}

export function ConfigureTargetsModal({ initialTargets }: ConfigureTargetsModalProps) {
  const [targets, setTargets] = useState(initialTargets)
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const totalAllocated = targets.reduce((sum, t) => sum + (t.targetWeight || 0), 0)

  const handleAddTarget = () => {
    const newTarget: TargetAllocationInput = {
      type: 'CLASS',
      assetClass: 'INDIVIDUAL_STOCK',
      targetWeight: 0
    }
    setTargets([...targets, { ...newTarget, id: `temp-${Date.now()}` }])
  }

  const handleDelete = async (id: string) => {
    if (id.startsWith('temp-')) {
      setTargets(targets.filter(t => t.id !== id))
      return
    }

    setIsSubmitting(true)
    try {
      await deleteTargetAllocation(id)
      setTargets(targets.filter(t => t.id !== id))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSave = async (target: any) => {
    setIsSubmitting(true)
    try {
      const input: TargetAllocationInput = {
        id: target.id?.startsWith('temp-') ? undefined : target.id,
        type: target.type,
        symbol: target.symbol,
        assetClass: target.assetClass,
        targetWeight: parseFloat(target.targetWeight.toString())
      }
      await upsertTargetAllocation(input)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="glass-premium border-white/10 hover:bg-white/10 text-slate-300 font-bold gap-2">
          <Settings2 className="h-4 w-4" />
          Configure Targets
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-premium border-white/5 bg-slate-950/90 text-white max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-black italic">
            <Target className="h-5 w-5 text-blue-500" />
            TARGET ALLOCATION MASTER
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4 py-4">
          {targets.map((target, index) => (
            <div key={target.id} className="grid grid-cols-12 gap-3 items-end bg-white/5 p-3 rounded-xl border border-white/5 group transition-all hover:border-white/10">
              <div className="col-span-3 space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Type</Label>
                <select 
                  className="w-full bg-slate-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={target.type}
                  onChange={(e) => {
                    const newTargets = [...targets]
                    newTargets[index].type = e.target.value
                    if (e.target.value === 'SYMBOL') {
                      newTargets[index].assetClass = null
                      newTargets[index].symbol = newTargets[index].symbol || ''
                    } else {
                      newTargets[index].symbol = null
                      newTargets[index].assetClass = newTargets[index].assetClass || 'INDIVIDUAL_STOCK'
                    }
                    setTargets(newTargets)
                  }}
                >
                  <option value="CLASS">Class</option>
                  <option value="SYMBOL">Symbol</option>
                </select>
              </div>

              <div className="col-span-4 space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {target.type === 'SYMBOL' ? 'Ticker Symbol' : 'Asset Class'}
                </Label>
                {target.type === 'SYMBOL' ? (
                  <Input 
                    className="bg-slate-900 border-white/10 h-9 text-xs font-bold uppercase"
                    placeholder="e.g. FPT"
                    value={target.symbol || ''}
                    onChange={(e) => {
                      const newTargets = [...targets]
                      newTargets[index].symbol = e.target.value.toUpperCase()
                      setTargets(newTargets)
                    }}
                    onBlur={() => handleSave(targets[index])}
                  />
                ) : (
                  <select 
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={target.assetClass || ''}
                    onChange={(e) => {
                      const newTargets = [...targets]
                      newTargets[index].assetClass = e.target.value
                      setTargets(newTargets)
                      handleSave(newTargets[index])
                    }}
                  >
                    <option value="INDIVIDUAL_STOCK">Equities</option>
                    <option value="ETF">ETF</option>
                    <option value="CRYPTO">Crypto</option>
                    <option value="REAL_ESTATE">Real Estate</option>
                    <option value="GOLD">Gold</option>
                    <option value="TERM_DEPOSIT">Term Deposits</option>
                    <option value="BOND_FUND">Bonds</option>
                  </select>
                )}
              </div>

              <div className="col-span-3 space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex justify-between">
                  Weight
                  <span className="text-blue-400 font-bold">%</span>
                </Label>
                <div className="relative">
                  <Input 
                    type="number"
                    className="bg-slate-900 border-white/10 h-9 pr-8 text-xs font-black tabular-nums"
                    value={target.targetWeight}
                    onChange={(e) => {
                      const newTargets = [...targets]
                      newTargets[index].targetWeight = e.target.value
                      setTargets(newTargets)
                    }}
                    onBlur={() => handleSave(targets[index])}
                  />
                  <Percent className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
                </div>
              </div>

              <div className="col-span-2 pb-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-full text-red-500/50 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  onClick={() => handleDelete(target.id)}
                  disabled={isSubmitting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {targets.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-white/5 rounded-2xl bg-white/5">
              <AlertCircle className="h-8 w-8 text-slate-500 mb-2 opacity-20" />
              <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">No targets defined</p>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-white/5 space-y-4">
          <div className="flex justify-between items-center px-2">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Allocated</span>
              <div className={cn(
                "text-2xl font-black tabular-nums",
                Math.abs(totalAllocated - 100) < 0.01 ? "text-emerald-400" : "text-amber-400"
              )}>
                {totalAllocated.toFixed(2)}%
                <span className="text-slate-500 text-sm font-bold ml-1">/ 100.00%</span>
              </div>
            </div>
            <Button onClick={handleAddTarget} variant="secondary" className="bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs gap-2 px-6">
              <Plus className="h-4 w-4" />
              Add Target
            </Button>
          </div>
          
          {Math.abs(totalAllocated - 100) > 0.01 && (
            <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
              <p className="text-[11px] text-amber-200/80 font-medium leading-relaxed">
                Your total allocation is <span className="font-bold text-amber-400">{totalAllocated.toFixed(2)}%</span>. 
                For optimal rebalancing, your target weights should sum to exactly 100%.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
