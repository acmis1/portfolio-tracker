"use client"

import * as React from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Pencil, Loader2, Trash2 } from "lucide-react"
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

import { FormErrorBanner } from "@/components/forms/form-error-banner"
import { LoadingSubmitButton } from "@/components/forms/loading-submit-button"
import { MoneyInput } from "@/components/forms/money-input"
import { FormSection } from "@/components/forms/form-section"

interface EditCashModalProps {
  transaction: {
    id: string;
    amount: number;
    date: Date | string;
    type: string;
    description?: string;
    referenceId?: string;
  };
}

export function EditCashModal({ transaction }: EditCashModalProps) {
  const [open, setOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const form = useForm<CashTransactionFormValues>({
    resolver: zodResolver(cashTransactionSchema),
    defaultValues: {
      amount: transaction.amount,
      date: new Date(transaction.date).toISOString().split('T')[0],
      type: transaction.type as CashTransactionFormValues["type"],
      description: transaction.description || "",
      referenceId: transaction.referenceId || "",
    },
  })

  async function onSubmit(data: CashTransactionFormValues) {
    setIsSubmitting(true)
    setError(null)
    try {
      const result = await updateCashTransaction(transaction.id, data)
      if (result.success) {
        setOpen(false)
      } else {
        setError(result.error || "Update failed")
      }
    } catch (error) {
      console.error(error)
      setError("Failed to update transaction")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this cash record? Historical portfolio snapshots will be recalculated.")) return
    
    setIsDeleting(true)
    setError(null)
    try {
      const result = await deleteCashTransaction(transaction.id)
      if (result.success) {
        setOpen(false)
      } else {
        setError(result.error || "Deletion failed")
      }
    } catch (error) {
      console.error(error)
      setError("Failed to delete transaction")
    } finally {
      setIsDeleting(false)
    }
  }

  const errors = form.formState.errors

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

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
          <FormErrorBanner message={error} />

          <FormSection title="Transaction Details">
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
                    <MoneyInput
                      id="amount"
                      error={!!errors.amount}
                      value={field.value}
                      onValueChange={(values) => {
                        field.onChange(values.floatValue || 0);
                      }}
                    />
                  )}
                />
              </div>
            </div>
          </FormSection>

          <FormSection title="Meta Information">
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input id="description" placeholder="e.g. Salary, Monthly DCA..." {...form.register("description")} />
            </div>
          </FormSection>

          <LoadingSubmitButton 
            isLoading={isSubmitting}
            loadingText="Updating..."
            variant="premium"
            disabled={isDeleting}
          >
            Save Changes
          </LoadingSubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  )
}
