"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface FormSectionProps {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {title}
            </h4>
          )}
          {description && (
            <p className="text-xs text-slate-400">
              {description}
            </p>
          )}
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}
