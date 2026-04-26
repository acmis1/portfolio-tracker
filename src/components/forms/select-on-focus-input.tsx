"use client"

import * as React from "react"
import { Input, type InputProps } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export const SelectOnFocusInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ onFocus, className, ...props }, ref) => {
    const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
      event.target.select()
      if (onFocus) {
        onFocus(event)
      }
    }

    return (
      <Input
        ref={ref}
        onFocus={handleFocus}
        className={cn("tabular-nums", className)}
        {...props}
      />
    )
  }
)

SelectOnFocusInput.displayName = "SelectOnFocusInput"
