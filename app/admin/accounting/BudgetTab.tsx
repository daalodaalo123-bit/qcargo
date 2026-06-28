'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Check, Trash2 } from 'lucide-react';
import { parseExpenseDate } from '@/lib/expense-analytics';

interface BillLite { category: string; amount: number; date: string; }
interface BudgetDoc { _id: string; category: string; monthlyBudget: number; }

export default function BudgetTab({ bills }: { bills: BillLite[] }) {
  const [budgets, setBudgets] = useState<BudgetDoc[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [val, setVal] = useState('');
  const [newCat, setNewCat] = useState('');
  const [newAmt, setNewAmt] = useState('');

  const money = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const load = useCallback(async () => {
    const res = await fetch('/api/finance/budget');
    if (res.ok) setBudgets(await res.json());
  }, []);
  useEffect(() => { load(); }, [load]);

  // Actual spend this month per category
  const actualByCat = useMemo(() => {
    const now = new Date();
    const map: Record<string, number> = {};
    for (const b of bills) {
      const d = parseExpenseDate(b.date);
      if (!d || d.getFullYear() !== now.getFullYear() || d.getMonth() !== now.getMonth()) continue;
      map[b.category] = (map[b.category] || 0) + b.amount;
    }
    return map;
  }, [bills]);

  // Union of budgeted + spent categories
  const rows = useMemo(() => {
    const cats = new Set<string>();
    budgets.forEach(b => cats.add(b.category));
    Object.keys(actualByCat).forEach(c => cats.add(c));
    return [...cats].sort().map(category => {
      const budget = budgets.find(b => b.category === category);
      const actual = actualByCat[category] || 0;
      const target = budget?.monthlyBudget || 0;
      const pct = target > 0 ? (actual / target) * 100 : null;
      return { category, id: budget?._id, target, actual, variance: target - actual, pct };
    });
  }, [budgets, actualByCat]);

  const saveBudget = async (category: string, amount: number) => {
    await fetch('/api/finance/budget', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, monthlyBudget: amount }),
    });
    await load();
  };

  const totalBudget = rows.reduce((s, r) => s + r.target, 0);
  const totalActual = rows.reduce((s, r) => s + r.actual, 0);
  const monthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-black text-slate-100">Budget vs Actual — {monthName}</h2>
        <p className="text-slate-400 text-sm mt-1">Set a monthly spending target per category and watch your real spend against it. Over-budget shows red.</p>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-4">
        <div className="shipment-card border border-slate-800 bg-[#131B2E] py-4">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Budget</p>
          <p className="text-xl font-black text-slate-100 mt-1">{money(totalBudget)}</p>
        </div>
        <div className="shipment-card border border-slate-800 bg-[#131B2E] py-4">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Actual Spend</p>
          <p className="text-xl font-black text-slate-100 mt-1">{money(totalActual)}</p>
        </div>
        <div className={`shipment-card border py-4 ${totalBudget - totalActual >= 0 ? 'border-emerald-800/30 bg-emerald-950/10' : 'border-rose-800/30 bg-rose-950/10'}`}>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Remaining</p>
          <p className={`text-xl font-black mt-1 ${totalBudget - totalActual >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{money(totalBudget - totalActual)}</p>
        </div>
      </div>

      {/* Add new */}
      <div className="flex flex-wrap items-end gap-3 shipment-card border border-slate-800 bg-[#131B2E]">
        <div className="flex-1 min-w-[160px]">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">New category</label>
          <input className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-[#0d9488]" value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="e.g. Customs" />
        </div>
        <div className="w-40">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Monthly budget $</label>
          <input className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-[#0d9488]" type="number" value={newAmt} onChange={e => setNewAmt(e.target.value)} placeholder="500" />
        </div>
        <button
          onClick={async () => { if (newCat.trim()) { await saveBudget(newCat.trim(), Number(newAmt) || 0); setNewCat(''); setNewAmt(''); } }}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#0d9488] hover:bg-[#0f766e] text-white text-sm font-black rounded-xl transition-colors">
          <Plus size={16} /> Add
        </button>
      </div>

      {/* Table */}
      <div className="shipment-card !p-0 overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/40 border-b border-slate-800">
                {['Category', 'Monthly Budget', 'Actual', 'Remaining', 'Used', ''].map(h => (
                  <th key={h} className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {rows.map(r => {
                const over = r.pct != null && r.pct > 100;
                return (
                  <tr key={r.category} className={`hover:bg-slate-800/20 ${over ? 'border-l-2 border-rose-500/50' : ''}`}>
                    <td className="px-6 py-4 font-bold text-slate-100">{r.category}</td>
                    <td className="px-6 py-4">
                      {editing === r.category ? (
                        <input autoFocus type="number" className="w-28 bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-100 focus:outline-none focus:border-[#0d9488]"
                          value={val} onChange={e => setVal(e.target.value)}
                          onKeyDown={async e => { if (e.key === 'Enter') { await saveBudget(r.category, Number(val) || 0); setEditing(null); } if (e.key === 'Escape') setEditing(null); }}
                          onBlur={async () => { await saveBudget(r.category, Number(val) || 0); setEditing(null); }} />
                      ) : (
                        <button onClick={() => { setEditing(r.category); setVal(String(r.target)); }} className="font-black text-slate-200 hover:text-[#0d9488]">{money(r.target)}</button>
                      )}
                    </td>
                    <td className="px-6 py-4 font-black text-slate-100">{money(r.actual)}</td>
                    <td className={`px-6 py-4 font-black ${r.variance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{money(r.variance)}</td>
                    <td className="px-6 py-4 w-48">
                      {r.pct != null ? (
                        <div>
                          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full ${over ? 'bg-rose-500' : r.pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, r.pct)}%` }} />
                          </div>
                          <span className={`text-[10px] font-black ${over ? 'text-rose-400' : 'text-slate-400'}`}>{r.pct.toFixed(0)}%</span>
                        </div>
                      ) : <span className="text-[10px] text-slate-600">no budget set</span>}
                    </td>
                    <td className="px-6 py-4">
                      {r.id && (
                        <button onClick={async () => { await fetch(`/api/finance/budget?id=${r.id}`, { method: 'DELETE' }); await load(); }} className="p-1.5 text-slate-600 hover:text-rose-400 rounded-lg"><Trash2 size={14} /></button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && <tr><td colSpan={6} className="px-6 py-12 text-center text-xs font-bold text-slate-500">No categories yet. Add one above.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-[10px] text-slate-600"><Check size={11} className="inline" /> Actual spend is read live from your vendor bills for the current month.</p>
    </div>
  );
}
