"use client"

import * as React from "react"
import { UseFormReturn, Controller } from "react-hook-form"
import { NumericFormat } from 'react-number-format'
import { Info } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { TransactionFormValues, ASSET_CLASSES } from "@/lib/validations"
import { cn } from "@/lib/utils"
import { formatVND } from "@/lib/utils/format"
import { formatAssetClass } from "@/lib/formatters"
import { FormErrorBanner } from "@/components/forms/form-error-banner"
import { FormSection } from "@/components/forms/form-section"
import { LoadingSubmitButton } from "@/components/forms/loading-submit-button"
import { TransactionFormMode } from "../types"

const TICKER_CLASSES = ['INDIVIDUAL_STOCK', 'ETF', 'STOCK_FUND', 'BOND_FUND', 'CRYPTO']

interface AssetTransactionFormProps {
  form: UseFormReturn<TransactionFormValues>
  mode: TransactionFormMode
  error: string | null
  isSubmitting: boolean
  submitLabel?: string
  loadingText?: string
  fxRate?: number
}

/**
 * Shared presentational form for asset transactions.
 * Centralizes layout and field logic for both Add and Edit flows.
 */
export function AssetTransactionForm({
  form,
  mode,
  error,
  isSubmitting,
  submitLabel = mode === "create" ? "Complete Transaction" : "Save Changes",
  loadingText = mode === "create" ? "Processing..." : "Updating...",
  fxRate = 25400,
}: AssetTransactionFormProps) {
  const { control, register, watch, formState: { errors } } = form
  
  const assetClass = watch("assetClass")
  const selectedCurrency = watch("currency")
  const inputPrice = watch("price")
  
  const isTickerAsset = TICKER_CLASSES.includes(assetClass)
  const isTermDeposit = assetClass === 'TERM_DEPOSIT'
  const isRealEstate = assetClass === 'REAL_ESTATE'
  const isGold = assetClass === 'GOLD'
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

  // Background values for unconventional assets
  React.useEffect(() => {
    if (isTermDeposit || isRealEstate) {
      form.setValue("quantity", 1)
    }
  }, [assetClass, isTermDeposit, isRealEstate, form])

  return (
    <div className="space-y-6">
      <FormErrorBanner message={error} />
      
      <FormSection title="Asset Specification">
        <div className="grid grid-cols-2 gap-4">
          <div className={cn("space-y-2", mode === "edit" && "opacity-50")}>
            <Label htmlFor="assetClass">Asset Class</Label>
            <Controller
              name="assetClass"
              control={control}
              render={({ field }) => (
                <Select 
                  id="assetClass" 
                  className={cn(errors.assetClass && "border-red-500/50")}
                  {...field}
                  disabled={mode === "edit"}
                >
                  {ASSET_CLASSES.map((ac) => (
                    <option key={ac} value={ac}>
                      {formatAssetClass(ac)}
                    </option>
                  ))}
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input 
              id="date" 
              type="date" 
              className={cn(errors.date && "border-red-500/50")}
              {...register("date")} 
            />
            {errors.date && (
              <p className="text-[10px] font-medium text-red-400">{errors.date.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {isTickerAsset && (
            <div className={cn("space-y-2 transition-all", mode === "edit" && "opacity-50")}>
              <Label htmlFor="symbol">Symbol</Label>
              <Input 
                id="symbol" 
                placeholder="BTC, AAPL..." 
                className={cn(errors.symbol && "border-red-500/50 focus-visible:ring-red-500/20")}
                {...register("symbol")}
                disabled={mode === "edit"}
              />
              {errors.symbol && (
                <p className="text-[10px] font-medium text-red-400">{errors.symbol.message}</p>
              )}
            </div>
          )}
          
          <div className={cn("space-y-2", (isTickerAsset && mode !== "edit") ? "" : "col-span-2", mode === "edit" && !isTermDeposit && !isRealEstate && "opacity-50")}>
            <Label htmlFor="name">{getNameLabel()}</Label>
            <Input 
              id="name" 
              placeholder={isTickerAsset ? "Bitcoin, Apple Inc..." : "Description..."} 
              className={cn(errors.name && "border-red-500/50")}
              {...register("name")}
              disabled={mode === "edit" && !isTermDeposit && !isRealEstate}
            />
            {errors.name && (
              <p className="text-[10px] font-medium text-red-400">{errors.name.message}</p>
            )}
          </div>
        </div>
      </FormSection>

      <FormSection title="Transaction Values">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="type">Transaction Type</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select 
                  id="type" 
                  className={cn(errors.type && "border-red-500/50")}
                  {...field}
                >
                  <option value="BUY">Buy/Deposit</option>
                  <option value="SELL">Sell/Withdraw</option>
                  <option value="DIVIDEND">Dividend</option>
                  <option value="INTEREST">Interest</option>
                </Select>
              )}
            />
          </div>
          
          <div className={cn("space-y-2", mode === "edit" && "opacity-50")}>
            <Label htmlFor="currency">Currency</Label>
            <Controller
              name="currency"
              control={control}
              render={({ field }) => (
                <Select 
                  id="currency" 
                  {...field}
                  disabled={mode === "edit"}
                >
                  <option value="VND">VND</option>
                  <option value="USD">USD</option>
                </Select>
              )}
            />
          </div>
        </div>

        {isTermDeposit && (
          <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
             <div className="space-y-2">
              <Label htmlFor="interestRate">Interest Rate (%)</Label>
              <Controller
                name="interestRate"
                control={control}
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
                      field.onChange(values.floatValue);
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
                {...register("maturityDate")} 
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
                control={control}
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
              control={control}
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
                control={control}
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
      </FormSection>

      <LoadingSubmitButton 
        isLoading={isSubmitting}
        loadingText={loadingText}
        variant="premium"
      >
        {submitLabel}
      </LoadingSubmitButton>
    </div>
  )
}
