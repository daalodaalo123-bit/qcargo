'use client';

import { Percent, Wallet, Scale, Box } from 'lucide-react';
import type { RevenueEfficiency } from '@/lib/accounting-summary';

function money(n: number | null) {
  if (n == null) return '—';
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function pct(n: number | null) {
  if (n == null) return '—';
  return `${n.toFixed(1)}%`;
}

export default function RevenueEfficiencyPanel({ data }: { data: RevenueEfficiency }) {
  const rows = [
    { label: 'Net margin', value: pct(data.netMarginPercent), icon: Percent, accent: 'text-emerald-400' },
    { label: 'Expense ratio', value: pct(data.expenseRatioPercent), icon: Wallet, accent: 'text-[#F15D38]' },
    { label: 'Profit / KG', value: money(data.profitPerKg), icon: Scale, accent: 'text-sky-300' },
    { label: 'Profit / CBM', value: money(data.profitPerCbm), icon: Box, accent: 'text-amber-300' },
  ];

  return (
    <div className="shipment-card border border-slate-800 !p-5">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
        Revenue efficiency
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {rows.map((row) => (
          <div key={row.label} className="rounded-xl bg-slate-900/60 border border-slate-800 p-3">
            <row.icon size={14} className={`${row.accent} mb-1.5`} />
            <p className="text-[8px] font-bold text-slate-500 uppercase">{row.label}</p>
            <p className={`text-sm font-black mt-1 ${row.accent}`}>{row.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
