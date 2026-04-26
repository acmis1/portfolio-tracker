"use client"

import * as React from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRightLeft, Loader2, Info } from "lucide-react"
import { NumericFormat } from 'react-number-format'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { assetConversionSchema, type AssetConversionValues, ASSET_CLASSES } from "@/lib/validations"
import { convertAsset, getUserAssets } from "@/features/transactions/actions"
import { cn } from "@/lib/utils"
import { formatAssetClass } from "@/lib/formatters"
import { useRouter } from "next/navigation"
import { ActionResult } from "../types"

interface AssetConversionModalProps {
  trigger?: React.ReactElement;
  initialFromAssetId?: string;
}

type AssetLookupResult = {
  id: string;
  symbol: string;
  name: string;
  assetClass: typeof ASSET_CLASSES[number];
  currency: 'VND' | 'USD';
}

export function AssetConversionModal({ 
  trigger, 
  initialFromAssetId = "",
}: AssetConversionModalProps) {
  const [open, setOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [assets, setAssets] = React.useState<AssetLookupResult[]>([])
  const router = useRouter()

  const form = useForm<AssetConversionValues>({
    resolver: zodResolver(assetConversionSchema),
    defaultValues: {
      fromAssetId: initialFromAssetId,
      date: new Date().toISOString().split('T')[0],
      fromQuantity: 0,
      toQuantity: 0,
      feeAmount: 0,
      toAsset: {
        symbol: "",
        name: "",
        assetClass: "CRYPTO",
        currency: "VND",
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any)

  // Fetch assets on open for autofill and source selection
  React.useEffect(() => {
    if (open) {
      getUserAssets().then((data) => setAssets(data as AssetLookupResult[]))
    }
  }, [open])

  // Sync initial values if they change (e.g. navigation)
  React.useEffect(() => {
    if (initialFromAssetId) {
      form.setValue("fromAssetId", initialFromAssetId)
    }
  }, [initialFromAssetId, form])

  const targetSymbol = form.watch("toAsset.symbol")

  // Smart Autofill for Target Asset
  React.useEffect(() => {
    if (!targetSymbol || targetSymbol.length < 2) return
    const match = assets.find(a => a.symbol.toUpperCase() === targetSymbol.toUpperCase().trim())
    if (match) {
      form.setValue("toAsset", {
        id: match.id,
        name: match.name,
        symbol: targetSymbol,
        assetClass: match.assetClass,
        currency: match.currency as 'VND' | 'USD'
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any, { shouldValidate: true })
    } else {
      form.setValue("toAsset.id", undefined)
    }
  }, [targetSymbol, assets, form])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function onSubmit(data: any) {
    setIsSubmitting(true)
    try {
      const values = data as AssetConversionValues
      // Normalize symbol
      if (values.toAsset) {
        values.toAsset.symbol = values.toAsset.symbol.toUpperCase().trim()
      }

      const result = await convertAsset(values) as ActionResult
      if (result.success) {
        setOpen(false)
        form.reset()
        router.refresh()
      } else {
        alert(result.error || "Something went wrong")
      }
    } catch (error: unknown) {
      console.error(error)
      alert("Failed to submit conversion")
    } finally {
      setIsSubmitting(false)
    }
  }

  const errors = form.formState.errors

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? trigger : (
          <Button variant="premium" size="sm">
            <ArrowRightLeft className="mr-2 h-4 w-4" /> Convert Asset
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] glass-premium border-white/10 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">Asset Conversion</DialogTitle>
          <DialogDescription className="text-slate-400">
            Use this for internal trades like USDT → BTC. This rolls the cost basis and does not affect cash balance.
          </DialogDescription>
        </DialogHeader>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4 py-4">
          
          {/* SECTION: SOURCE ASSET */}
          <div className="space-y-4 p-4 rounded-xl bg-white/5 border border-white/5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20">1</span>
              Source Asset (Selling)
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Asset</Label>
                <Controller
                  name="fromAssetId"
                  control={form.control}
                  render={({ field }) => (
                    <Select 
                      id="fromAssetId" 
                      className={cn(errors.fromAssetId && "border-red-500/50")}
                      {...field}
                      disabled={!!initialFromAssetId}
                    >
                      <option value="" disabled>Select Asset</option>
                      {assets.filter(a => a.assetClass !== 'TERM_DEPOSIT').map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.symbol} - {a.name}
                        </option>
                      ))}
                    </Select>
                  )}
                />
                {errors.fromAssetId && (
                  <p className="text-[10px] font-medium text-red-400">{errors.fromAssetId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Quantity Spent</Label>
                <Controller
                  name="fromQuantity"
                  control={form.control}
                  render={({ field }) => (
                    <NumericFormat
                      id="fromQuantity"
                      className={cn(errors.fromQuantity && "border-red-500/50")}
                      customInput={Input}
                      thousandSeparator="."
                      decimalSeparator=","
                      placeholder="0.00"
                      value={field.value}
                      onValueChange={(values) => {
                        field.onChange(values.floatValue || 0);
                      }}
                    />
                  )}
                />
                {errors.fromQuantity && (
                  <p className="text-[10px] font-medium text-red-400">{errors.fromQuantity.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-center -my-2 relative z-10">
            <div className="bg-slate-900 p-1 rounded-full border border-white/10">
              <ArrowRightLeft className="h-4 w-4 text-slate-400 rotate-90" />
            </div>
          </div>

          {/* SECTION: TARGET ASSET */}
          <div className="space-y-4 p-4 rounded-xl bg-white/5 border border-white/5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20">2</span>
              Target Asset (Buying)
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Symbol</Label>
                <Input 
                  placeholder="BTC, ETH..." 
                  className={cn(errors.toAsset?.symbol && "border-red-500/50")}
                  {...form.register("toAsset.symbol")}
                />
                {errors.toAsset?.symbol && (
                  <p className="text-[10px] font-medium text-red-400">{errors.toAsset.symbol.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Quantity Received</Label>
                <Controller
                  name="toQuantity"
                  control={form.control}
                  render={({ field }) => (
                    <NumericFormat
                      id="toQuantity"
                      className={cn(errors.toQuantity && "border-red-500/50")}
                      customInput={Input}
                      thousandSeparator="."
                      decimalSeparator=","
                      placeholder="0.00"
                      value={field.value}
                      onValueChange={(values) => {
                        field.onChange(values.floatValue || 0);
                      }}
                    />
                  )}
                />
                {errors.toQuantity && (
                  <p className="text-[10px] font-medium text-red-400">{errors.toQuantity.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input 
                  placeholder="Bitcoin, Ethereum..." 
                  className={cn(errors.toAsset?.name && "border-red-500/50")}
                  {...form.register("toAsset.name")}
                />
                {errors.toAsset?.name && (
                  <p className="text-[10px] font-medium text-red-400">{errors.toAsset.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Asset Class</Label>
                <Controller
                  name="toAsset.assetClass"
                  control={form.control}
                  render={({ field }) => (
                    <Select 
                      className={cn(errors.toAsset?.assetClass && "border-red-500/50")}
                      {...field}
                    >
                      {ASSET_CLASSES.filter(ac => ac !== 'TERM_DEPOSIT').map((ac) => (
                        <option key={ac} value={ac}>
                          {formatAssetClass(ac)}
                        </option>
                      ))}
                    </Select>
                  )}
                />
              </div>
            </div>
          </div>

          {/* SECTION: DETAILS */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input 
                type="date" 
                className={cn(errors.date && "border-red-500/50")}
                {...form.register("date")} 
              />
            </div>
            <div className="space-y-2">
              <Label>Venue (Optional)</Label>
              <Input 
                placeholder="Binance, OKX..." 
                {...form.register("venue")}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Pair Price (Optional)</Label>
              <Controller
                name="originalPairPrice"
                control={form.control}
                render={({ field }) => (
                  <NumericFormat
                    className={cn(errors.originalPairPrice && "border-red-500/50")}
                    customInput={Input}
                    thousandSeparator="."
                    decimalSeparator=","
                    placeholder="65.000,50"
                    value={field.value}
                    onValueChange={(values) => {
                      field.onChange(values.floatValue || 0);
                    }}
                  />
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Fee Amount (Optional)</Label>
              <Controller
                name="feeAmount"
                control={form.control}
                render={({ field }) => (
                  <NumericFormat
                    className={cn(errors.feeAmount && "border-red-500/50")}
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
              <Label>Fee Currency</Label>
              <Input 
                placeholder="USDT, BNB..." 
                {...form.register("feeCurrency")}
              />
              <p className="text-[10px] text-slate-500 mt-1">
                If fee is in target asset, received qty will be adjusted.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Note</Label>
              <Input 
                placeholder="Buy the dip..." 
                {...form.register("note")}
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full mt-4" 
            variant="premium"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Conversion...
              </>
            ) : (
              "Complete Conversion"
            )}
          </Button>
          
          <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 p-3 text-[11px] text-amber-200/80 border border-amber-500/20">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <p>
              This is an internal asset exchange. No cash transactions will be created. 
              The VND cost basis of the source asset will be rolled over into the target asset.
            </p>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
