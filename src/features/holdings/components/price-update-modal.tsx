"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { TrendingUp, Loader2 } from "lucide-react"
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

const priceUpdateSchema = z.object({
  symbol: z.string().min(1, "Symbol is required").toUpperCase(),
  date: z.string().min(1, "Date is required"),
  price: z.number().positive("Price must be positive"),
  currency: z.enum(['VND', 'USD']),
})

type PriceUpdateFormValues = z.infer<typeof priceUpdateSchema>

export function PriceUpdateModal() {
  const [open, setOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<PriceUpdateFormValues>({
    resolver: zodResolver(priceUpdateSchema),
    defaultValues: {
      symbol: "",
      date: new Date().toISOString().split('T')[0],
      price: 0,
      currency: "VND",
    },
  })

  async function onSubmit(data: PriceUpdateFormValues) {
    setIsSubmitting(true)
    try {
      const result = await addPriceUpdate(data)
      if (result.success) {
        setOpen(false)
        form.reset()
      } else {
        alert(result.error || "Something went wrong")
      }
    } catch (error: any) {
      console.error(error)
      alert("Failed to update price")
    } finally {
      setIsSubmitting(false)
    }
  }

  const errors = form.formState.errors

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="glass-premium border-white/10 text-slate-400 hover:text-white">
          <TrendingUp className="mr-2 h-4 w-4" /> Update Price
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] glass-premium border-white/10">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">Manual Price Update</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
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
              <Select 
                id="currency" 
                className={cn(errors.currency && "border-red-500/50")}
                {...form.register("currency")}
              >
                <option value="VND">VND</option>
                <option value="USD">USD</option>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Closing Price ({form.watch("currency")})</Label>
            <Input 
              id="price" 
              type="number" 
              step="any"
              className={cn(errors.price && "border-red-500/50")}
              {...form.register("price", { valueAsNumber: true })}
            />
            {errors.price && (
              <p className="text-[10px] font-medium text-red-400">{errors.price.message}</p>
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
                Updating...
              </>
            ) : (
              "Save Price Point"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
