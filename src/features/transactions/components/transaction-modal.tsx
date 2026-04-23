"use client"

import * as React from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Loader2, Info } from "lucide-react"
import { NumericFormat } from 'react-number-format'
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
import { addTransaction, getUserAssets } from "@/features/transactions/actions"
import { cn } from "@/lib/utils"
import { formatVND } from "@/lib/utils/format"

interface TransactionModalProps {
  trigger?: React.ReactElement;
  fxRate?: number; // Optional live rate for conversion preview
  initialSymbol?: string;
  initialAssetClass?: string;
  initialName?: string;
  initialCurrency?: string;
}

const TICKER_CLASSES = ['STOCK', 'CRYPTO', 'MUTUAL_FUND']

export function TransactionModal({ 
  trigger, 
  fxRate = 25400,
  initialSymbol = "",
  initialAssetClass = "STOCK",
  initialName = "",
  initialCurrency = "VND"
}: TransactionModalProps) {
  const [open, setOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [assets, setAssets] = React.useState<any[]>([])

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      symbol: initialSymbol,
      name: initialName,
      assetClass: initialAssetClass as any,
      type: "BUY",
      quantity: 1,
      price: 0,
      fees: 0,
      currency: initialCurrency as any,
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

  // Class-specific flags
  const isTermDeposit = assetClass === 'TERM_DEPOSIT'
  const isRealEstate = assetClass === 'REAL_ESTATE'
  const isGold = assetClass === 'GOLD'

  // Smart Autofill logic
  React.useEffect(() => {
    if (!symbol || symbol.length < 2) return
    const match = assets.find(a => a.symbol.toLowerCase() === symbol.toLowerCase())
    if (match) {
      form.setValue("name", match.name)
      form.setValue("assetClass", match.assetClass as any)
    }
  }, [symbol, assets, form])

  // Background values for unconventional assets
  React.useEffect(() => {
    if (isTermDeposit || isRealEstate) {
      form.setValue("quantity", 1)
    }
  }, [assetClass, isTermDeposit, isRealEstate, form])

  async function onSubmit(data: TransactionFormValues) {
    setIsSubmitting(true)
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
        alert(result.error || "Something went wrong")
      }
    } catch (error: any) {
      console.error(error)
      alert("Failed to submit transaction")
    } finally {
      setIsSubmitting(false)
    }
  }

  const errors = form.formState.errors
  const selectedCurrency = form.watch("currency")
  const inputPrice = form.watch("price")
  const isUSD = selectedCurrency === 'USD'

  const getNameLabel = () => {
    if (isGold) return "Asset Name (e.g. SJC Gold Bar)"
    if (isTermDeposit) return "Bank & Term (e.g. VCB 6-Month)"
    if (isRealEstate) return "Property Name"
    return "Full Name"
  }

  const getPriceLabel = () => {
    if (isTermDeposit) return `Principal Amount (${selectedCurrency})`
    if (isRealEstate) return `Total Purchase Price (${selectedCurrency})`
    return `Price per Unit (${selectedCurrency})`
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
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
            {isTickerAsset && (
              <div className="space-y-2 transition-all">
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
            )}
            
            <div className={cn("space-y-2", isTickerAsset ? "" : "col-span-2")}>
              <Label htmlFor="name">{getNameLabel()}</Label>
              <Input 
                id="name" 
                placeholder={isTickerAsset ? "Bitcoin, Apple Inc..." : "Description..."} 
                className={cn(errors.name && "border-red-500/50")}
                {...form.register("name")}
              />
              {errors.name && (
                <p className="text-[10px] font-medium text-red-400">{errors.name.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Transaction Type</Label>
              <Select 
                id="type" 
                className={cn(errors.type && "border-red-500/50")}
                {...form.register("type")}
              >
                <option value="BUY">Buy/Deposit</option>
                <option value="SELL">Sell/Withdraw</option>
                <option value="DIVIDEND">Dividend</option>
                <option value="INTEREST">Interest</option>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select 
                id="currency" 
                {...form.register("currency")}
              >
                <option value="VND">VND</option>
                <option value="USD">USD</option>
              </Select>
            </div>
          </div>

          {isTermDeposit && (
            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
               <div className="space-y-2">
                <Label htmlFor="interestRate">Interest Rate (%)</Label>
                <Controller
                  name="interestRate"
                  control={form.control}
                  render={({ field }) => (
                    <NumericFormat
                      id="interestRate"
                      className={cn(errors.interestRate && "border-red-500/50")}
                      customInput={Input}
                      thousandSeparator="."
                      decimalSeparator=","
                      placeholder="8.5"
                      value={field.value}
                      onValueChange={(values) => {
                        field.onChange(values.floatValue || 0);
                      }}
                    />
                  )}
                />
                {errors.interestRate && (
                  <p className="text-[10px] font-medium text-red-400">{errors.interestRate.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="maturityDate">Maturity Date</Label>
                <Input 
                  id="maturityDate" 
                  type="date" 
                  className={cn(errors.maturityDate && "border-red-500/50")}
                  {...form.register("maturityDate")} 
                />
                {errors.maturityDate && (
                  <p className="text-[10px] font-medium text-red-400">{errors.maturityDate.message}</p>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {!isTermDeposit && !isRealEstate && (
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Controller
                  name="quantity"
                  control={form.control}
                  render={({ field }) => (
                    <NumericFormat
                      id="quantity"
                      className={cn(errors.quantity && "border-red-500/50")}
                      customInput={Input}
                      thousandSeparator="."
                      decimalSeparator=","
                      value={field.value}
                      onValueChange={(values) => {
                        field.onChange(values.floatValue || 0);
                      }}
                    />
                  )}
                />
                {errors.quantity && (
                  <p className="text-[10px] font-medium text-red-400">{errors.quantity.message}</p>
                )}
              </div>
            )}
            
            <div className={cn("space-y-2 relative", (isTermDeposit || isRealEstate) ? "col-span-2" : "")}>
              <Label htmlFor="price">{getPriceLabel()}</Label>
              <Controller
                name="price"
                control={form.control}
                render={({ field }) => (
                  <NumericFormat
                    id="price"
                    className={cn(errors.price && "border-red-500/50")}
                    customInput={Input}
                    thousandSeparator="."
                    decimalSeparator=","
                    value={field.value}
                    onValueChange={(values) => {
                      field.onChange(values.floatValue || 0);
                    }}
                  />
                )}
              />
              {isUSD && inputPrice > 0 && (
                <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-emerald-500/80 animate-in fade-in slide-in-from-top-1">
                  <Info className="h-2.5 w-2.5" />
                  Est. {formatVND(inputPrice * fxRate)}
                </div>
              )}
              {errors.price && (
                <p className="text-[10px] font-medium text-red-400">{errors.price.message}</p>
              )}
            </div>

            {!isTermDeposit && !isGold && (
              <div className="space-y-2">
                <Label htmlFor="fees">Fees ({selectedCurrency})</Label>
                <Controller
                  name="fees"
                  control={form.control}
                  render={({ field }) => (
                    <NumericFormat
                      id="fees"
                      className={cn(errors.fees && "border-red-500/50")}
                      customInput={Input}
                      thousandSeparator="."
                      decimalSeparator=","
                      value={field.value}
                      onValueChange={(values) => {
                        field.onChange(values.floatValue || 0);
                      }}
                    />
                  )}
                />
                {errors.fees && (
                  <p className="text-[10px] font-medium text-red-400">{errors.fees.message}</p>
                )}
              </div>
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
