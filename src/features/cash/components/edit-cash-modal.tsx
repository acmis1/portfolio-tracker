"use client"

import * as React from "react"
import { Pencil, Loader2, Trash2 } from "lucide-react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CashTransactionForm } from "./cash-transaction-form"
import { updateCashTransaction, deleteCashTransaction } from "../actions"
import { type CashTransactionFormValues } from "../validations"

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
    } catch (err) {
      console.error(err)
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
    } catch (err) {
      console.error(err)
      setError("Failed to delete transaction")
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

        <CashTransactionForm
          mode="edit"
          defaultValues={{
            amount: transaction.amount,
            date: new Date(transaction.date).toISOString().split('T')[0],
            type: transaction.type as CashTransactionFormValues["type"],
            description: transaction.description || "",
            referenceId: transaction.referenceId || "",
          }}
          onSubmit={onSubmit}
          onDelete={handleDelete}
          isSubmitting={isSubmitting}
          isDeleting={isDeleting}
          error={error}
        />
      </DialogContent>
    </Dialog>
  )
}
