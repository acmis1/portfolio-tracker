import { Suspense } from "react"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getUnifiedActivity } from "@/features/transactions/queries"
import { ActivityLedgerTable, ActivityLedgerSkeleton } from "@/features/transactions/components/activity-ledger-table"
import { PageShell } from "@/components/layout/page-shell"

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LedgerPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in")
  }

  const activities = await getUnifiedActivity(userId);

  return (
    <PageShell contentClassName="space-y-10">
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
          <ActivityLedgerTable activities={activities} />
        </div>
      </Suspense>
    </PageShell>
  );
}
