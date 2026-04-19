import { formatCurrency } from "@/lib/formatters";
import { CashTransaction } from "@prisma/client";

interface RecentPayoutsTableProps {
  transactions: CashTransaction[];
}

export function RecentPayoutsTable({ transactions }: RecentPayoutsTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="glass-premium rounded-2xl p-8 text-center border border-white/5">
        <p className="text-slate-400 font-medium">No recent payouts detected in the ledger.</p>
      </div>
    );
  }

  return (
    <div className="glass-premium overflow-hidden rounded-2xl border border-white/5 shadow-2xl">
      <div className="px-6 py-4 border-b border-white/5 bg-white/5">
        <h3 className="text-sm font-black uppercase tracking-widest text-white">Recent Income Events</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/5 bg-white/5">
              <th className="px-6 py-3 font-black uppercase tracking-wider text-slate-400 text-[10px]">Date</th>
              <th className="px-6 py-3 font-black uppercase tracking-wider text-slate-400 text-[10px]">Type</th>
              <th className="px-6 py-3 font-black uppercase tracking-wider text-slate-400 text-[10px]">Description</th>
              <th className="px-6 py-3 text-right font-black uppercase tracking-wider text-slate-400 text-[10px]">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {transactions.map((tx: any) => (
              <tr key={tx.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-6 py-4 text-slate-300 font-medium">
                  {new Date(tx.date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                    tx.type === 'DIVIDEND' 
                      ? 'bg-emerald-500/10 text-emerald-400' 
                      : 'bg-blue-500/10 text-blue-400'
                  }`}>
                    {tx.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-400 max-w-xs truncate">
                  {tx.description || <span className="italic opacity-50 text-[10px]">No description provided</span>}
                </td>
                <td className="px-6 py-4 text-right font-black text-white">
                  {formatCurrency(tx.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
