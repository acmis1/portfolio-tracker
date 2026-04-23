"use client"

import * as React from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Pencil, Loader2, Info, Trash2 } from "lucide-react"
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
import { editTransaction, deleteTransaction } from "@/features/transactions/actions"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/formatters"
import { formatVND } from "@/lib/utils/format"

interface EditTransactionModalProps {
  transaction: any;
  asset: {
    symbol: string;
    name: string;
    assetClass: any;
    currency: any;
  };
  fxRate?: number;
}

export function EditTransactionModal({ transaction, asset, fxRate = 25400 }: EditTransactionModalProps) {
  const [open, setOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      symbol: asset.symbol,
      name: asset.name,
      assetClass: asset.assetClass,
      type: transaction.type,
      quantity: transaction.quantity,
      price: transaction.pricePerUnit, // Default assumes VND unless we track currency on tx level differently
      fees: 0, // Fees are often not stored separately in the main tx object in this schema? (checking...)
      currency: asset.currency,
      date: new Date(transaction.date).toISOString().split('T')[0],
    },
  })

  async function onSubmit(data: TransactionFormValues) {
    setIsSubmitting(true)
    try {
      const result = await editTransaction(transaction.id, data)
      if (result.success) {
        setOpen(false)
      } else {
        alert(result.error || "Update failed")
      }
    } catch (error: any) {
      console.error(error)
      alert("Failed to update transaction")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this transaction? This will also remove associated cash ledger entries and recalculate history.")) return
    
    setIsDeleting(true)
    try {
      const result = await deleteTransaction(transaction.id)
      if (result.success) {
        setOpen(false)
      } else {
        alert(result.error || "Deletion failed")
      }
    } catch (error: any) {
      console.error(error)
      alert("Failed to delete transaction")
    } finally {
      setIsDeleting(false)
    }
  }

  const errors = form.formState.errors
  const selectedCurrency = form.watch("currency")
  const inputPrice = form.watch("price")
  const isUSD = selectedCurrency === 'USD'

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-white hover:bg-white/10">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] glass-premium border-white/10">
        <DialogHeader className="flex flex-row items-center justify-between pr-8">
          <DialogTitle className="text-xl font-bold text-white">Edit Transaction</DialogTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleDelete}
            disabled={isDeleting || isSubmitting}
            className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </Button>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          {/* Form fields same as TransactionModal but disabled as appropriate or prefilled */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 opacity-50 cursor-not-allowed">
              <Label htmlFor="symbol">Symbol</Label>
              <Input id="symbol" value={asset.symbol} disabled className="bg-slate-900 border-white/5" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select id="type" {...form.register("type")}>
                <option value="BUY">Buy</option>
                <option value="SELL">Sell</option>
                <option value="DIVIDEND">Dividend</option>
                <option value="INTEREST">Interest</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" {...form.register("date")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Controller
                name="quantity"
                control={form.control}
                render={({ field }) => (
                  <NumericFormat
                    id="quantity"
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
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select id="currency" {...form.register("currency")}>
                <option value="VND">VND</option>
                <option value="USD">USD</option>
              </Select>
            </div>
            <div className="space-y-2 relative">
              <Label htmlFor="price">Price</Label>
              <Controller
                name="price"
                control={form.control}
                render={({ field }) => (
                  <NumericFormat
                    id="price"
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
                <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-emerald-500/80">
                  <Info className="h-2.5 w-2.5" />
                  Est. {formatVND(inputPrice * fxRate)}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
             <Label htmlFor="fees">Fees ({selectedCurrency})</Label>
             <Controller
               name="fees"
               control={form.control}
               render={({ field }) => (
                 <NumericFormat
                   id="fees"
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
          </div>

          <Button 
            type="submit" 
            className="w-full mt-2" 
            variant="premium"
            disabled={isSubmitting || isDeleting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
