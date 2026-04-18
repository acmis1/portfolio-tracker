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
import { transactionSchema, type TransactionFormValues } from "@/lib/validations"
import { addTransaction } from "@/features/transactions/actions"
import { cn } from "@/lib/utils"

interface TransactionModalProps {
  trigger?: React.ReactElement
}

export function TransactionModal({ trigger }: TransactionModalProps) {
  const [open, setOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      symbol: "",
      name: "",
      assetClass: "STOCK",
      type: "BUY",
      quantity: 1,
      price: 0,
      fees: 0,
      date: new Date().toISOString().split('T')[0],
    },
  })

  async function onSubmit(data: TransactionFormValues) {
    setIsSubmitting(true)
    try {
      const result = await addTransaction(data)
      if (result.success) {
        setOpen(false)
        form.reset()
      } else {
        alert(result.error || "Something went wrong")
      }
    } catch (error) {
      console.error(error)
      alert("Failed to submit transaction")
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
            <Plus className="mr-2 h-4 w-4" /> Add Transaction
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] glass-premium border-white/10">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">New Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="symbol">Symbol</Label>
              <Input 
                id="symbol" 
                placeholder="BTC, AAPL..." 
                className={cn(errors.symbol && "border-red-500/50 focus-visible:ring-red-500/20")}
                {...form.register("symbol")}
              />
              {errors.symbol && (
                <p className="text-[10px] font-medium text-red-400">{errors.symbol.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="assetClass">Asset Class</Label>
              <Select 
                id="assetClass" 
                className={cn(errors.assetClass && "border-red-500/50")}
                {...form.register("assetClass")}
              >
                <option value="STOCK">Stock</option>
                <option value="CRYPTO">Crypto</option>
                <option value="MUTUAL_FUND">Mutual Fund</option>
                <option value="GOLD">Gold</option>
                <option value="TERM_DEPOSIT">Term Deposit</option>
                <option value="REAL_ESTATE">Real Estate</option>
              </Select>
              {errors.assetClass && (
                <p className="text-[10px] font-medium text-red-400">{errors.assetClass.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input 
              id="name" 
              placeholder="Bitcoin, Apple Inc..." 
              className={cn(errors.name && "border-red-500/50")}
              {...form.register("name")}
            />
            {errors.name && (
              <p className="text-[10px] font-medium text-red-400">{errors.name.message}</p>
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
                <option value="BUY">Buy</option>
                <option value="SELL">Sell</option>
                <option value="DIVIDEND">Dividend</option>
                <option value="INTEREST">Interest</option>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input 
                id="quantity" 
                type="number" 
                step="any"
                className={cn(errors.quantity && "border-red-500/50")}
                {...form.register("quantity", { valueAsNumber: true })}
              />
              {errors.quantity && (
                <p className="text-[10px] font-medium text-red-400">{errors.quantity.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price per Unit (VND)</Label>
              <Input 
                id="price" 
                type="number" 
                step="any"
                className={cn(errors.price && "border-red-500/50")}
                {...form.register("price", { valueAsNumber: true })}
              />
              {errors.price && (
                <p className="text-[10px] font-medium text-red-400">{errors.price.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fees">Fees (VND)</Label>
            <Input 
              id="fees" 
              type="number" 
              step="any"
              className={cn(errors.fees && "border-red-500/50")}
              {...form.register("fees", { valueAsNumber: true })}
            />
            {errors.fees && (
              <p className="text-[10px] font-medium text-red-400">{errors.fees.message}</p>
            )}
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
                Processing...
              </>
            ) : (
              "Complete Transaction"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
