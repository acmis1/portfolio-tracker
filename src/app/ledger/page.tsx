import { Suspense } from "react"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getUnifiedActivity } from "@/features/transactions/queries"
import { ActivityLedgerTable, ActivityLedgerSkeleton } from "@/features/transactions/components/activity-ledger-table"

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LedgerPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in")
  }

  const activities = await getUnifiedActivity(userId);

  return (
    <main className="min-h-screen bg-slate-950 p-6 lg:p-10">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl space-y-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">
              Unified Ledger
            </h1>
            <p className="text-slate-400 font-medium">
              Comprehensive record of all cash flows, asset trades, and passive income events
            </p>
          </div>
        </div>

        <Suspense fallback={<ActivityLedgerSkeleton />}>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 px-1">
                Activity History
              </h2>
            </div>
            {/* We'll pass the activities to the table. We might need to update the table component to handle the new fields. */}
            <ActivityLedgerTable activities={activities} />
          </div>
        </Suspense>
      </div>
    </main>
  );
}
