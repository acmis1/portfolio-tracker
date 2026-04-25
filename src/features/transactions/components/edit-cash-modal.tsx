"use client"

import * as React from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Pencil, Loader2, Trash2 } from "lucide-react"
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
import { cashTransactionSchema, type CashTransactionFormValues } from "@/features/cash/validations"
import { updateCashTransaction, deleteCashTransaction } from "@/features/cash/actions"
import { cn } from "@/lib/utils"

interface EditCashModalProps {
  transaction: any;
}

export function EditCashModal({ transaction }: EditCashModalProps) {
  const [open, setOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const form = useForm<CashTransactionFormValues>({
    resolver: zodResolver(cashTransactionSchema),
    defaultValues: {
      amount: transaction.amount,
      date: new Date(transaction.date).toISOString().split('T')[0],
      type: transaction.type,
      description: transaction.description || "",
      referenceId: transaction.referenceId || "",
    },
  })

  async function onSubmit(data: CashTransactionFormValues) {
    setIsSubmitting(true)
    try {
      const result = await updateCashTransaction(transaction.id, data)
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
    if (!confirm("Are you sure you want to delete this cash record? Historical portfolio snapshots will be recalculated.")) return
    
    setIsDeleting(true)
    try {
      const result = await deleteCashTransaction(transaction.id)
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-500 hover:text-white hover:bg-white/10 ml-2">
          <Pencil className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] glass-premium border-white/10">
        <DialogHeader className="flex flex-row items-center justify-between pr-8">
          <DialogTitle className="text-xl font-bold text-white">Edit Cash Entry</DialogTitle>
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
          <div className="space-y-2">
            <Label htmlFor="type">Transaction Type</Label>
            <Select id="type" {...form.register("type")}>
              <option value="DEPOSIT">Deposit</option>
              <option value="WITHDRAWAL">Withdrawal</option>
              <option value="DIVIDEND">Dividend</option>
              <option value="INTEREST">Interest</option>
              <option value="BUY_ASSET">Buy Asset</option>
              <option value="SELL_ASSET">Sell Asset</option>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" {...form.register("date")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (VND)</Label>
              <Controller
                name="amount"
                control={form.control}
                render={({ field }) => (
                  <NumericFormat
                    id="amount"
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

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input id="description" placeholder="e.g. Salary, Monthly DCA..." {...form.register("description")} />
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
