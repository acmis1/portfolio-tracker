"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Loader2 } from "lucide-react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { cashTransactionSchema, type CashTransactionFormValues } from "../validations"
import { addCashTransaction } from "../actions"
import { cn } from "@/lib/utils"

interface AddCashModalProps {
  trigger?: React.ReactElement
}

export function AddCashModal({ trigger }: AddCashModalProps) {
  const [open, setOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<CashTransactionFormValues>({
    resolver: zodResolver(cashTransactionSchema),
    defaultValues: {
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      type: "DEPOSIT",
      description: "",
      referenceId: "",
    },
  })

  async function onSubmit(data: CashTransactionFormValues) {
    setIsSubmitting(true)
    try {
      const result = await addCashTransaction(data)
      if (result.success) {
        setOpen(false)
        form.reset()
      } else {
        alert(result.error || "Something went wrong")
      }
    } catch (error: any) {
      console.error(error)
      alert("Failed to record cash transaction")
    } finally {
      setIsSubmitting(false)
    }
  }

  const errors = form.formState.errors

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="premium" size="sm">
            <Plus className="mr-2 h-4 w-4" /> Record Cash Flow
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] glass-premium border-white/10">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">Record Cash Flow</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (VND)</Label>
            <Input 
              id="amount" 
              type="number" 
              step="any"
              className={cn(errors.amount && "border-red-500/50")}
              {...form.register("amount", { valueAsNumber: true })}
            />
            {errors.amount && (
              <p className="text-[10px] font-medium text-red-400">{errors.amount.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select 
                id="type" 
                className={cn(errors.type && "border-red-500/50")}
                {...form.register("type")}
              >
                <option value="DEPOSIT">Deposit</option>
                <option value="WITHDRAWAL">Withdrawal</option>
                <option value="DIVIDEND">Dividend (In)</option>
                <option value="INTEREST">Interest (In)</option>
                <option value="SELL_ASSET">Asset Sale (In)</option>
                <option value="BUY_ASSET">Asset Buy (Out)</option>
              </Select>
              {errors.type && (
                <p className="text-[10px] font-medium text-red-400">{errors.type.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input 
                id="date" 
                type="date" 
                className={cn(errors.date && "border-red-500/50")}
                {...form.register("date")} 
              />
              {errors.date && (
                <p className="text-[10px] font-medium text-red-400">{errors.date.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input 
              id="description" 
              placeholder="e.g. Monthly savings, Quarterly dividend..." 
              className={cn(errors.description && "border-red-500/50")}
              {...form.register("description")}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full mt-2" 
            variant="premium"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Recording...
              </>
            ) : (
              "Record Transaction"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
