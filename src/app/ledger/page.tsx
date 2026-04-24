import { Suspense } from "react"
import { getCashTransactions } from "@/features/cash/actions"
import { CashLedgerTable } from "@/features/cash/components/cash-ledger-table"

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LedgerPage() {
  const transactions = await getCashTransactions();

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
              Portfolio Ledger
            </h1>
            <p className="text-slate-400 font-medium">
              Complete historical record of all transactions and cash flows
            </p>
          </div>
        </div>

        <Suspense fallback={<div className="h-64 w-full animate-pulse rounded-2xl glass-premium" />}>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 px-1">
                Transaction History
              </h2>
            </div>
            <CashLedgerTable transactions={transactions} />
          </div>
        </Suspense>
      </div>
    </main>
  );
}
