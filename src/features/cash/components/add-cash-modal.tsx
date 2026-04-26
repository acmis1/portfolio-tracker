"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CashTransactionForm } from "./cash-transaction-form"
import { addCashTransaction } from "../actions"
import { type CashTransactionFormValues } from "../validations"

interface AddCashModalProps {
  trigger?: React.ReactElement
}

export function AddCashModal({ trigger }: AddCashModalProps) {
  const [open, setOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function onSubmit(data: CashTransactionFormValues) {
    setIsSubmitting(true)
    setError(null)
    try {
      const result = await addCashTransaction(data)
      if (result.success) {
        setOpen(false)
      } else {
        setError(result.error || "Something went wrong")
      }
    } catch (err: any) {
      console.error(err)
      setError("Failed to record cash transaction")
    } finally {
      setIsSubmitting(false)
    }
  }

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
        
        <CashTransactionForm
          mode="create"
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          error={error}
        />
      </DialogContent>
    </Dialog>
  )
}
