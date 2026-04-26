"use client"

import * as React from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { cashTransactionSchema, type CashTransactionFormValues } from "../validations"
import { FormErrorBanner } from "@/components/forms/form-error-banner"
import { LoadingSubmitButton } from "@/components/forms/loading-submit-button"
import { MoneyInput } from "@/components/forms/money-input"
import { FormSection } from "@/components/forms/form-section"

interface CashTransactionFormProps {
  mode: "create" | "edit"
  defaultValues?: Partial<CashTransactionFormValues>
  onSubmit: (data: CashTransactionFormValues) => Promise<void>
  onDelete?: () => Promise<void>
  isSubmitting: boolean
  isDeleting?: boolean
  error: string | null
}

export function CashTransactionForm({
  mode,
  defaultValues,
  onSubmit,
  onDelete,
  isSubmitting,
  isDeleting = false,
  error,
}: CashTransactionFormProps) {
  const form = useForm<CashTransactionFormValues>({
    resolver: zodResolver(cashTransactionSchema),
    defaultValues: {
      amount: defaultValues?.amount ?? 0,
      date: defaultValues?.date ?? new Date().toISOString().split('T')[0],
      type: defaultValues?.type ?? "DEPOSIT",
      description: defaultValues?.description ?? "",
      referenceId: defaultValues?.referenceId ?? "",
    },
  })

  const errors = form.formState.errors

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
      <FormErrorBanner message={error} />

      <FormSection title="Transaction Details">
        <div className="space-y-2">
          <Label htmlFor="type">Transaction Type</Label>
          <Select id="type" {...form.register("type")}>
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

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input 
              id="date" 
              type="date" 
              className={errors.date ? "border-red-500/50" : ""}
              {...form.register("date")} 
            />
            {errors.date && (
              <p className="text-[10px] font-medium text-red-400">{errors.date.message}</p>
            )}
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
            {errors.amount && (
              <p className="text-[10px] font-medium text-red-400">{errors.amount.message}</p>
            )}
          </div>
        </div>
      </FormSection>

      <FormSection title="Meta Information">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input 
              id="description" 
              placeholder="e.g. Monthly savings, Quarterly dividend..." 
              className={errors.description ? "border-red-500/50" : ""}
              {...form.register("description")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="referenceId">Reference ID (Optional)</Label>
            <Input 
              id="referenceId" 
              placeholder="Internal tracking or bank reference" 
              className={errors.referenceId ? "border-red-500/50" : ""}
              {...form.register("referenceId")}
            />
          </div>
        </div>
      </FormSection>

      <div className="flex flex-col gap-3">
        <LoadingSubmitButton 
          isLoading={isSubmitting}
          loadingText={mode === "create" ? "Recording..." : "Updating..."}
          variant="premium"
          disabled={isDeleting}
        >
          {mode === "create" ? "Record Transaction" : "Save Changes"}
        </LoadingSubmitButton>
      </div>
    </form>
  )
}
