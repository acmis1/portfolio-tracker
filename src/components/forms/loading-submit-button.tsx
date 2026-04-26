"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface LoadingSubmitButtonProps extends ButtonProps {
  isLoading: boolean
  loadingText?: string
}

export function LoadingSubmitButton({
  isLoading,
  loadingText = "Saving...",
  children,
  className,
  disabled,
  ...props
}: LoadingSubmitButtonProps) {
  return (
    <Button
      {...props}
      disabled={isLoading || disabled}
      className={cn("w-full transition-all active:scale-[0.98]", className)}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  )
}
