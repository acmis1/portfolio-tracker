import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Info } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AssetDetailLoading() {
  return (
    <div className="space-y-8 pb-20">
      {/* Header Skeleton */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" disabled className="h-9 w-9 rounded-xl bg-white/5 border border-white/5">
          <ArrowLeft className="h-4 w-4 text-slate-700" />
        </Button>
        <div className="space-y-1">
          <Skeleton className="h-3 w-24 bg-white/5" />
          <Skeleton className="h-8 w-48 bg-white/5" />
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 glass-premium rounded-3xl p-8 border border-white/5 flex flex-col justify-between min-h-[240px]">
          <div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-32 bg-white/5" />
              <Skeleton className="h-6 w-20 bg-white/5 rounded-full" />
            </div>
            <div className="mt-4">
              <Skeleton className="h-12 w-64 bg-white/5" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-16 bg-white/5" />
                <Skeleton className="h-5 w-20 bg-white/5" />
              </div>
            ))}
          </div>
        </div>

        <div className="glass-premium rounded-3xl p-8 border border-white/5 space-y-6">
          <div className="flex items-center gap-2">
            <Info className="h-3 w-3 text-slate-700" />
            <Skeleton className="h-3 w-24 bg-white/5" />
          </div>
          
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-3 w-16 bg-white/5" />
                <Skeleton className="h-3 w-24 bg-white/5" />
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-white/5">
            <Skeleton className="h-10 w-full bg-white/5 rounded-md" />
          </div>
        </div>
      </div>

      {/* Transaction History Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Skeleton className="h-4 w-4 bg-white/5" />
          <Skeleton className="h-4 w-40 bg-white/5" />
        </div>
        
        <div className="glass-premium rounded-2xl border border-white/5 overflow-hidden">
          <div className="border-b border-white/5 bg-white/5 p-4">
            <div className="grid grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-3 bg-white/10" />
              ))}
            </div>
          </div>
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="grid grid-cols-6 gap-4">
                {[1, 2, 3, 4, 5, 6].map((j) => (
                  <Skeleton key={j} className="h-4 bg-white/5" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
