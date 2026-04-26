"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus } from "lucide-react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { transactionSchema, type TransactionFormValues } from "@/lib/validations"
import { addTransaction, getUserAssets } from "@/features/transactions/actions"
import { AssetTransactionForm } from "./asset-transaction-form"

interface TransactionModalProps {
  trigger?: React.ReactElement;
  fxRate?: number;
  initialSymbol?: string;
  initialAssetClass?: string;
  initialName?: string;
  initialCurrency?: string;
}

const TICKER_CLASSES = ['INDIVIDUAL_STOCK', 'ETF', 'STOCK_FUND', 'BOND_FUND', 'CRYPTO']

export function TransactionModal({ 
  trigger, 
  fxRate = 25400,
  initialSymbol = "",
  initialAssetClass = "INDIVIDUAL_STOCK",
  initialName = "",
  initialCurrency = "VND"
}: TransactionModalProps) {
  const [open, setOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [assets, setAssets] = React.useState<{ symbol: string; name: string; assetClass: string }[]>([])

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      symbol: initialSymbol,
      name: initialName,
      assetClass: initialAssetClass as TransactionFormValues["assetClass"],
      type: "BUY",
      quantity: 1,
      price: 0,
      fees: 0,
      currency: initialCurrency as TransactionFormValues["currency"],
      date: new Date().toISOString().split('T')[0],
    },
  })

  // Fetch assets on open for autofill
  React.useEffect(() => {
    if (open) {
      getUserAssets().then(setAssets)
    }
  }, [open])

  const symbol = form.watch("symbol")
  const assetClass = form.watch("assetClass")
  const isTickerAsset = TICKER_CLASSES.includes(assetClass)

  // Smart Autofill logic
  React.useEffect(() => {
    if (!symbol || symbol.length < 2) return
    const match = assets.find(a => a.symbol.toLowerCase() === symbol.toLowerCase())
    if (match) {
      form.setValue("name", match.name, { shouldValidate: true })
      form.setValue("assetClass", match.assetClass as TransactionFormValues["assetClass"], { shouldValidate: true })
    }
  }, [symbol, assets, form])

  async function onSubmit(data: TransactionFormValues) {
    setIsSubmitting(true)
    setError(null)
    try {
      // Auto-generate symbol for non-ticker assets if not provided
      if (!isTickerAsset && !data.symbol) {
        data.symbol = data.name.toUpperCase().replace(/\s+/g, '_').trim()
      }

      const result = await addTransaction(data)
      if (result.success) {
        setOpen(false)
        form.reset()
      } else {
        setError(result.error || "Something went wrong")
      }
    } catch (error) {
      console.error(error)
      setError("Failed to submit transaction")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? trigger : (
          <Button variant="premium" size="sm">
            <Plus className="mr-2 h-4 w-4" /> Add Transaction
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] glass-premium border-white/10">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">New Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="py-4">
          <AssetTransactionForm
            form={form}
            mode="create"
            error={error}
            isSubmitting={isSubmitting}
            fxRate={fxRate}
          />
        </form>
      </DialogContent>
    </Dialog>
  )
}
