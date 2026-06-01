'use client';

import type { BatchMarginRow } from '@/lib/accounting-summary';

function money(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function BatchMarginTable({ rows }: { rows: BatchMarginRow[] }) {
  return (
    <div className="shipment-card !p-0 overflow-hidden border border-slate-800">
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/40">
        <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest">Profit by batch</h3>
        <p className="text-xs text-slate-500 font-medium mt-1">Freight vs costs tagged to the same batch ID</p>
      </div>
      <div className="overflow-x-auto max-h-[280px] overflow-y-auto">
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-slate-900 z-10">
            <tr className="border-b border-slate-800">
              <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">Batch</th>
              <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase text-right">Revenue</th>
              <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase text-right">Costs</th>
              <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase text-right">Net</th>
              <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase text-right">Margin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {rows.slice(0, 12).map((row) => (
              <tr key={row.batchId} className="hover:bg-slate-800/30">
                <td className="px-6 py-3 text-xs font-mono font-bold text-[#F15D38]">{row.batchId}</td>
                <td className="px-6 py-3 text-right text-xs font-bold text-slate-200">{money(row.revenue)}</td>
                <td className="px-6 py-3 text-right text-xs font-bold text-slate-400">{money(row.expenses)}</td>
                <td
                  className={`px-6 py-3 text-right text-xs font-black ${
                    row.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {money(row.netProfit)}
                </td>
                <td className="px-6 py-3 text-right text-xs font-bold text-slate-300">
                  {row.marginPercent != null ? `${row.marginPercent.toFixed(1)}%` : '—'}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-xs font-bold text-slate-500">
                  Tag shipments and bills with a batch ID to see profit per batch.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
