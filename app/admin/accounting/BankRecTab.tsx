'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';

interface BankRow {
  _id: string;
  date: string;
  description: string;
  amount: number;
  direction: 'IN' | 'OUT';
  account: 'BANK' | 'ZAAD' | 'EDAHAB' | 'CASH';
  matched: boolean;
}

const ACCOUNTS = ['BANK', 'ZAAD', 'EDAHAB', 'CASH'] as const;

export default function BankRecTab() {
  const [rows, setRows] = useState<BankRow[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [account, setAccount] = useState<typeof ACCOUNTS[number]>('BANK');
  const [direction, setDirection] = useState<'IN' | 'OUT'>('IN');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const money = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/finance/bank');
      if (res.ok) setRows(await res.json());
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!amount || Number(amount) <= 0) return;
    setSaving(true);
    try {
      const res = await fetch('/api/finance/bank', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, account, direction, amount: Number(amount), description }),
      });
      if (res.ok) { setAmount(''); setDescription(''); await load(); }
      else { const d = await res.json().catch(() => ({})); alert(d.error || 'Failed'); }
    } finally { setSaving(false); }
  };

  const toggleMatch = async (r: BankRow) => {
    setRows(prev => prev.map(x => x._id === r._id ? { ...x, matched: !x.matched } : x));
    await fetch(`/api/finance/bank?id=${r._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ matched: !r.matched }) });
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this statement line?')) return;
    setRows(prev => prev.filter(x => x._id !== id));
    await fetch(`/api/finance/bank?id=${id}`, { method: 'DELETE' });
  };

  const totals = useMemo(() => {
    let reconciled = 0, unreconciled = 0, net = 0;
    for (const r of rows) {
      const signed = r.direction === 'IN' ? r.amount : -r.amount;
      net += signed;
      if (r.matched) reconciled += r.amount; else unreconciled += r.amount;
    }
    return { reconciled, unreconciled, net };
  }, [rows]);

  const field = 'bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none focus:border-[#0d9488]';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-black text-slate-100">Bank Reconciliation</h2>
        <p className="text-slate-400 text-sm mt-1">Enter your bank / Zaad / eDahab / cash statement lines, then tick each one once you&apos;ve matched it to a recorded payment.</p>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-4">
        <div className="shipment-card border border-emerald-800/30 bg-emerald-950/10 py-4">
          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Reconciled</p>
          <p className="text-xl font-black text-slate-100 mt-1">{money(totals.reconciled)}</p>
        </div>
        <div className="shipment-card border border-amber-800/30 bg-amber-950/10 py-4">
          <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Unreconciled</p>
          <p className="text-xl font-black text-slate-100 mt-1">{money(totals.unreconciled)}</p>
        </div>
        <div className="shipment-card border border-slate-800 bg-[#131B2E] py-4">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Net Movement</p>
          <p className={`text-xl font-black mt-1 ${totals.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{money(totals.net)}</p>
        </div>
      </div>

      {/* Add line */}
      <div className="shipment-card border border-slate-800 bg-[#131B2E] flex flex-wrap items-end gap-3">
        <div><label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5">Date</label><input type="date" className={field} value={date} onChange={e => setDate(e.target.value)} /></div>
        <div><label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5">Account</label>
          <select className={field} value={account} onChange={e => setAccount(e.target.value as typeof ACCOUNTS[number])}>{ACCOUNTS.map(a => <option key={a} value={a}>{a}</option>)}</select></div>
        <div><label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5">In / Out</label>
          <select className={field} value={direction} onChange={e => setDirection(e.target.value as 'IN' | 'OUT')}><option value="IN">Money In</option><option value="OUT">Money Out</option></select></div>
        <div><label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5">Amount $</label><input type="number" className={`${field} w-28`} value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" /></div>
        <div className="flex-1 min-w-[140px]"><label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5">Description</label><input type="text" className={`${field} w-full`} value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Zaad from customer" /></div>
        <button onClick={add} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-[#0d9488] hover:bg-[#0f766e] disabled:opacity-50 text-white text-sm font-black rounded-xl transition-colors"><Plus size={16} /> Add</button>
      </div>

      {/* Table */}
      <div className="shipment-card !p-0 overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/40 border-b border-slate-800">
                {['Matched', 'Date', 'Account', 'Description', 'In / Out', 'Amount', ''].map(h => (
                  <th key={h} className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-xs font-bold text-slate-500">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-xs font-bold text-slate-500">No statement lines yet. Add your bank/Zaad/eDahab activity above.</td></tr>
              ) : rows.map(r => (
                <tr key={r._id} className={`hover:bg-slate-800/20 ${r.matched ? 'opacity-60' : ''}`}>
                  <td className="px-5 py-4">
                    <button onClick={() => toggleMatch(r)} className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-colors ${r.matched ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-600 text-transparent hover:border-[#0d9488]'}`}>
                      <Check size={14} />
                    </button>
                  </td>
                  <td className="px-5 py-4 text-xs font-bold text-slate-400">{r.date}</td>
                  <td className="px-5 py-4"><span className="text-[10px] font-black text-slate-300 bg-slate-800 px-2 py-1 rounded">{r.account}</span></td>
                  <td className="px-5 py-4 text-sm font-bold text-slate-200">{r.description || '—'}</td>
                  <td className="px-5 py-4"><span className={`text-[10px] font-black ${r.direction === 'IN' ? 'text-emerald-400' : 'text-rose-400'}`}>{r.direction === 'IN' ? 'IN' : 'OUT'}</span></td>
                  <td className={`px-5 py-4 font-black ${r.direction === 'IN' ? 'text-emerald-400' : 'text-rose-400'}`}>{r.direction === 'IN' ? '+' : '−'}{money(r.amount)}</td>
                  <td className="px-5 py-4"><button onClick={() => remove(r._id)} className="p-1.5 text-slate-600 hover:text-rose-400 rounded-lg"><Trash2 size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
