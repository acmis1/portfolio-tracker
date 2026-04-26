"use client"

import * as React from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { TrendingUp } from "lucide-react"
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
import { z } from "zod"
import { addPriceUpdate } from "@/features/holdings/actions"
import { cn } from "@/lib/utils"

import { FormErrorBanner } from "@/components/forms/form-error-banner"
import { LoadingSubmitButton } from "@/components/forms/loading-submit-button"
import { MoneyInput } from "@/components/forms/money-input"
import { FormSection } from "@/components/forms/form-section"

const priceUpdateSchema = z.object({
  symbol: z.string().min(1, "Symbol is required").toUpperCase(),
  date: z.string().min(1, "Date is required"),
  price: z.number().positive("Price must be positive"),
  currency: z.enum(['VND', 'USD']),
})

type PriceUpdateFormValues = z.infer<typeof priceUpdateSchema>

interface PriceUpdateModalProps {
  initialSymbol?: string;
  initialCurrency?: string;
  trigger?: React.ReactNode;
  title?: string;
}

export function PriceUpdateModal({ 
  initialSymbol = "", 
  initialCurrency = "VND",
  trigger,
  title = "Manual Price Update"
}: PriceUpdateModalProps) {
  const [open, setOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const form = useForm<PriceUpdateFormValues>({
    resolver: zodResolver(priceUpdateSchema),
    defaultValues: {
      symbol: initialSymbol,
      date: new Date().toISOString().split('T')[0],
      price: 0,
      currency: initialCurrency as PriceUpdateFormValues["currency"],
    },
  })

  async function onSubmit(data: PriceUpdateFormValues) {
    setIsSubmitting(true)
    setError(null)
    try {
      const result = await addPriceUpdate(data)
      if (result.success) {
        setOpen(false)
        form.reset()
      } else {
        setError(result.error || "Something went wrong")
      }
    } catch (error) {
      console.error(error)
      setError("Failed to update price")
    } finally {
      setIsSubmitting(false)
    }
  }

  const errors = form.formState.errors

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="glass-premium border-white/10 text-slate-400 hover:text-white">
            <TrendingUp className="mr-2 h-4 w-4" /> Update Price
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] glass-premium border-white/10">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">{title}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
          <FormErrorBanner message={error} />

          <FormSection title="Asset Identification">
            <div className="space-y-2">
              <Label htmlFor="symbol">Symbol</Label>
              <Input 
                id="symbol" 
                placeholder="BTC, AAPL, VESAF..." 
                className={cn(errors.symbol && "border-red-500/50")}
                {...form.register("symbol")}
              />
              {errors.symbol && (
                <p className="text-[10px] font-medium text-red-400">{errors.symbol.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Controller
                  name="currency"
                  control={form.control}
                  render={({ field }) => (
                    <Select 
                      id="currency" 
                      className={cn(errors.currency && "border-red-500/50")}
                      {...field}
                    >
                      <option value="VND">VND</option>
                      <option value="USD">USD</option>
                    </Select>
                  )}
                />
              </div>
            </div>
          </FormSection>

          <FormSection title="Pricing Data">
            <div className="space-y-2">
              <Label htmlFor="price">Closing Price ({form.watch("currency")})</Label>
              <Controller
                name="price"
                control={form.control}
                render={({ field }) => (
                  <MoneyInput
                    id="price"
                    error={!!errors.price}
                    value={field.value}
                    onValueChange={(values) => {
                      field.onChange(values.floatValue || 0);
                    }}
                  />
                )}
              />
              {errors.price && (
                <p className="text-[10px] font-medium text-red-400">{errors.price.message}</p>
              )}
            </div>
          </FormSection>

          <LoadingSubmitButton 
            isLoading={isSubmitting}
            loadingText="Updating..."
            variant="premium"
          >
            Save Price Point
          </LoadingSubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  )
}
