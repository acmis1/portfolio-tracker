import { cn } from "@/lib/utils"
import React from "react"

interface PageShellProps {
  children: React.ReactNode
  className?: string
  contentClassName?: string
  showGlow?: boolean
  maxWidth?: "default" | "wide" | "full"
}

export function PageShell({
  children,
  className,
  contentClassName,
  showGlow = true,
  maxWidth = "default"
}: PageShellProps) {
  const maxWidthClasses = {
    default: "max-w-7xl",
    wide: "max-w-[1440px]",
    full: "max-w-full"
  }

  return (
    <main className={cn("relative min-h-screen bg-slate-950", className)}>
      {/* Background Atmosphere */}
      {showGlow && (
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
        </div>
      )}

      <div className={cn(
        "relative z-10 mx-auto p-6 lg:p-10",
        maxWidthClasses[maxWidth],
        contentClassName
      )}>
        {children}
      </div>
    </main>
  )
}
