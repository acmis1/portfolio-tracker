import * as React from "react"
import { cn } from "@/lib/utils"

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  variant?: "default" | "subtle" | "elevated" | "warning"
  padding?: "none" | "sm" | "md" | "lg"
  radius?: "xl" | "2xl" | "3xl"
  hoverLift?: boolean
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, className, variant = "default", padding = "md", radius = "2xl", hoverLift = false, ...props }, ref) => {
    
    const variants = {
      default: "glass-premium border border-white/5",
      subtle: "bg-white/5 border border-white/5 backdrop-blur-sm",
      elevated: "glass-premium border border-white/5 shadow-2xl",
      warning: "glass-premium border border-amber-500/20 bg-amber-500/5"
    }

    const paddings = {
      none: "",
      sm: "p-4",
      md: "p-6",
      lg: "p-8"
    }

    const radii = {
      xl: "rounded-xl",
      "2xl": "rounded-2xl",
      "3xl": "rounded-3xl"
    }

    return (
      <div
        ref={ref}
        className={cn(
          variants[variant],
          paddings[padding],
          radii[radius],
          hoverLift && "hover-lift transition-all duration-300",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

GlassCard.displayName = "GlassCard"

export { GlassCard }
