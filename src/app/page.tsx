import { Navigation } from "@/components/navigation"
import { OverviewCards } from "@/components/overview-cards"

export default function Home() {
  return (
    <div className="flex h-screen flex-col bg-white dark:bg-slate-950">
      <Navigation />
      
      <main className="flex-1 overflow-auto">
        <div className="px-6 py-8">
          <OverviewCards />
        </div>
      </main>
    </div>
  )
}
