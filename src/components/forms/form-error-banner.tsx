"use client"

import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface FormErrorBannerProps {
  message?: string | null
  className?: string
}

export function FormErrorBanner({ message, className }: FormErrorBannerProps) {
  if (!message) return null

  return (
    <div className={cn(
      "flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 animate-in fade-in slide-in-from-top-2 duration-300",
      className
    )}>
      <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
      <p className="text-sm font-medium leading-relaxed">{message}</p>
    </div>
  )
}
