"use client"

import * as React from "react"
import { NumericFormat, type NumericFormatProps } from 'react-number-format'
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface MoneyInputProps extends Omit<NumericFormatProps, 'customInput'> {
  error?: boolean
}

export function MoneyInput({ 
  className, 
  error, 
  onFocus,
  ...props 
}: MoneyInputProps) {
  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    event.target.select()
    if (onFocus) {
      onFocus(event)
    }
  }

  return (
    <NumericFormat
      customInput={Input}
      thousandSeparator="."
      decimalSeparator=","
      allowNegative={false}
      onFocus={handleFocus}
      className={cn(
        "tabular-nums",
        error && "border-red-500/50 focus-visible:ring-red-500/50",
        className
      )}
      {...props}
    />
  )
}
