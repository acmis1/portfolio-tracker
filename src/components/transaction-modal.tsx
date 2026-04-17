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
  DialogTrigger 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { transactionSchema, type TransactionFormValues } from "@/lib/validations"
import { addTransaction } from "@/app/actions/transactions"

interface TransactionModalProps {
  trigger?: React.ReactNode
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
    } catch {
      alert("Failed to submit transaction")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="premium" size="sm">
            <Plus className="mr-2 h-4 w-4" /> Add Transaction
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="symbol">Symbol</Label>
              <Input 
                id="symbol" 
                placeholder="BTC, AAPL..." 
                {...form.register("symbol")}
              />
              {form.formState.errors.symbol && (
                <p className="text-[10px] text-red-500">{form.formState.errors.symbol.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="assetClass">Asset Class</Label>
              <Select id="assetClass" {...form.register("assetClass")}>
                <option value="STOCK">Stock</option>
                <option value="CRYPTO">Crypto</option>
                <option value="MUTUAL_FUND">Mutual Fund</option>
                <option value="GOLD">Gold</option>
                <option value="TERM_DEPOSIT">Term Deposit</option>
                <option value="REAL_ESTATE">Real Estate</option>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input 
              id="name" 
              placeholder="Bitcoin, Apple Inc..." 
              {...form.register("name")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select id="type" {...form.register("type")}>
                <option value="BUY">Buy</option>
                <option value="SELL">Sell</option>
                <option value="DIVIDEND">Dividend</option>
                <option value="INTEREST">Interest</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" {...form.register("date")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input 
                id="quantity" 
                type="number" 
                step="any"
                {...form.register("quantity", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price per Unit (VND)</Label>
              <Input 
                id="price" 
                type="number" 
                {...form.register("price", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fees">Fees (VND)</Label>
            <Input 
              id="fees" 
              type="number" 
              {...form.register("fees", { valueAsNumber: true })}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
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
