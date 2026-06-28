'use client';

import { useState, useMemo } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { parseExpenseDate } from '@/lib/expense-analytics';
import type { FinanceSettings } from './SetupTab';

interface ShipLite { date: string; total: number; }
type Period = 'this_month' | 'this_year' | 'all';

export default function TaxTab({ shipments, settings, onGoSetup }: { shipments: ShipLite[]; settings: FinanceSettings | null; onGoSetup: () => void }) {
  const [period, setPeriod] = useState<Period>('this_month');
  const money = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const revenue = useMemo(() => {
    const now = new Date();
    return shipments.filter(s => {
      const d = parseExpenseDate(s.date);
      if (!d) return false;
      if (period === 'this_month') return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      if (period === 'this_year') return d.getFullYear() === now.getFullYear();
      return true;
    }).reduce((s, sh) => s + sh.total, 0);
  }, [shipments, period]);

  if (!settings?.vatEnabled) {
    return (
      <div className="shipment-card border border-slate-800 bg-[#131B2E] text-center py-16 animate-in fade-in duration-300">
        <SettingsIcon size={40} className="text-slate-600 mx-auto mb-4" />
        <p className="text-lg font-black text-slate-100">VAT / Sales Tax is turned off</p>
        <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">Nothing is being taxed right now. Turn it on and set a rate in the Setup tab to see tax estimates here.</p>
        <button onClick={onGoSetup} className="mt-5 px-5 py-2.5 bg-[#0d9488] hover:bg-[#0f766e] text-white text-sm font-black rounded-xl transition-colors">Go to Setup</button>
      </div>
    );
  }

  const rate = settings.vatRate;
  const label = settings.vatLabel || 'VAT';
  const tax = revenue * (rate / 100);

  const LABELS: Record<Period, string> = { this_month: 'This Month', this_year: 'This Year', all: 'All Time' };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-100">{label} Report</h2>
          <p className="text-slate-400 text-sm mt-1">Estimated {label} ({rate}%) on freight revenue, for filing.</p>
        </div>
        <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
          {(['this_month', 'this_year', 'all'] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${period === p ? 'bg-[#F15D38] text-white' : 'text-slate-400 hover:text-slate-200'}`}>
              {LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="shipment-card border border-slate-800 bg-[#131B2E]">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Revenue ({LABELS[period]})</p>
          <p className="text-2xl font-black text-slate-100 mt-1">{money(revenue)}</p>
        </div>
        <div className="shipment-card border border-slate-800 bg-[#131B2E]">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label} Rate</p>
          <p className="text-2xl font-black text-slate-100 mt-1">{rate}%</p>
        </div>
        <div className="shipment-card border border-[#F15D38]/30 bg-[#F15D38]/10">
          <p className="text-[10px] font-black text-[#F15D38] uppercase tracking-widest">{label} Due / Collected</p>
          <p className="text-2xl font-black text-slate-100 mt-1">{money(tax)}</p>
        </div>
      </div>
      <p className="text-[10px] text-slate-600 leading-relaxed">Estimate = revenue × rate. This is a guide for filing, not a legal tax document. Adjust the rate anytime in Setup.</p>
    </div>
  );
}
