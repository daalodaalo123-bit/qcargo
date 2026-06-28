'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Save, Check, Target, FileText, DollarSign } from 'lucide-react';

function inThisMonth(dateStr: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

export default function TargetsTab() {
  const [revenueTarget, setRevenueTarget] = useState('0');
  const [quotesTarget, setQuotesTarget] = useState('0');
  const [actualRevenue, setActualRevenue] = useState(0);
  const [actualQuotes, setActualQuotes] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    try {
      const [tRes, qRes, iRes] = await Promise.all([
        fetch('/api/crm/targets'), fetch('/api/quotations'), fetch('/api/invoices'),
      ]);
      if (tRes.ok) { const t = await tRes.json(); setRevenueTarget(String(t.monthlyRevenueTarget || 0)); setQuotesTarget(String(t.monthlyQuotesTarget || 0)); }
      if (qRes.ok) { const q = await qRes.json(); setActualQuotes((Array.isArray(q) ? q : []).filter((x: { date: string }) => inThisMonth(x.date)).length); }
      if (iRes.ok) {
        const inv = await iRes.json();
        const rev = (Array.isArray(inv) ? inv : [])
          .filter((x: { paymentDate?: string; createdAt?: string }) => inThisMonth(x.paymentDate || x.createdAt || ''))
          .reduce((s: number, x: { totalAmount?: number }) => s + (x.totalAmount || 0), 0);
        setActualRevenue(rev);
      }
    } catch (e) { console.error(e); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true); setSaved(false);
    try {
      const res = await fetch('/api/crm/targets', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthlyRevenueTarget: Number(revenueTarget), monthlyQuotesTarget: Number(quotesTarget) }),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
      else { const d = await res.json().catch(() => ({})); alert(d.error || 'Failed'); }
    } finally { setSaving(false); }
  };

  const money = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  const monthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const revPct = useMemo(() => Number(revenueTarget) > 0 ? (actualRevenue / Number(revenueTarget)) * 100 : null, [actualRevenue, revenueTarget]);
  const qPct = useMemo(() => Number(quotesTarget) > 0 ? (actualQuotes / Number(quotesTarget)) * 100 : null, [actualQuotes, quotesTarget]);

  const field = 'w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[#F15D38]';
  const lbl = 'block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2';

  const Progress = ({ pct }: { pct: number | null }) => (
    pct == null ? <p className="text-[10px] text-slate-600 mt-2">Set a target to track progress</p> : (
      <div className="mt-3">
        <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
          <div className={`h-full ${pct >= 100 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-[#F15D38]'}`} style={{ width: `${Math.min(100, pct)}%` }} />
        </div>
        <p className={`text-[11px] font-black mt-1.5 ${pct >= 100 ? 'text-emerald-400' : 'text-slate-400'}`}>{pct.toFixed(0)}% of target{pct >= 100 ? ' — reached! 🎉' : ''}</p>
      </div>
    )
  );

  return (
    <div className="animate-in fade-in duration-300 space-y-8 max-w-4xl">
      <div>
        <h2 className="text-xl font-black text-slate-100 flex items-center gap-2"><Target className="text-[#F15D38]" size={20} /> Sales Targets — {monthName}</h2>
        <p className="text-slate-400 text-sm mt-1">Set monthly goals and track real progress. Revenue = invoices this month; Quotes = quotations created this month.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue */}
        <div className="shipment-card border border-slate-800 bg-[#131B2E]">
          <div className="flex items-center gap-2 mb-3"><DollarSign size={16} className="text-emerald-400" /><h3 className="text-sm font-black text-slate-200 uppercase tracking-widest">Revenue</h3></div>
          <p className="text-3xl font-black text-slate-100">{money(actualRevenue)}</p>
          <p className="text-[11px] font-bold text-slate-500">of {money(Number(revenueTarget))} target</p>
          <Progress pct={revPct} />
          <label className={`${lbl} mt-4`}>Monthly revenue target $</label>
          <input className={field} type="number" value={revenueTarget} onChange={e => setRevenueTarget(e.target.value)} />
        </div>

        {/* Quotes */}
        <div className="shipment-card border border-slate-800 bg-[#131B2E]">
          <div className="flex items-center gap-2 mb-3"><FileText size={16} className="text-[#F15D38]" /><h3 className="text-sm font-black text-slate-200 uppercase tracking-widest">Quotations</h3></div>
          <p className="text-3xl font-black text-slate-100">{actualQuotes}</p>
          <p className="text-[11px] font-bold text-slate-500">of {quotesTarget} target</p>
          <Progress pct={qPct} />
          <label className={`${lbl} mt-4`}>Monthly quotes target</label>
          <input className={field} type="number" value={quotesTarget} onChange={e => setQuotesTarget(e.target.value)} />
        </div>
      </div>

      <button onClick={save} disabled={saving}
        className="flex items-center gap-2 px-6 py-3 bg-[#F15D38] hover:bg-[#d94e2d] disabled:opacity-50 text-white text-sm font-black rounded-xl transition-colors">
        {saved ? <Check size={16} /> : <Save size={16} />}{saved ? 'Saved!' : saving ? 'Saving…' : 'Save Targets'}
      </button>
    </div>
  );
}
