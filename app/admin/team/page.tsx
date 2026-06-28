'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileText, DollarSign, Users, Ship, Package, Trophy, Wallet } from 'lucide-react';
import { ROLE_META, type StaffRole } from '@/lib/permissions';

interface TeamMember {
  id: string;
  name: string;
  username: string;
  role: StaffRole;
  photo: string;
  lastSeen: string | null;
  quotations: number;
  payments: number;
  collected: number;
  customers: number;
  shipments: number;
  batches: number;
}

type Period = 'week' | 'month' | 'all';

const PERIODS: { key: Period; label: string }[] = [
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'all', label: 'All Time' },
];

function isOnline(lastSeen: string | null) {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 2 * 60 * 1000;
}

export default function TeamPage() {
  const [period, setPeriod] = useState<Period>('week');
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/team/report?period=${period}`);
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || 'Failed to load report');
        setTeam([]);
        return;
      }
      const data = await res.json();
      setTeam(data.team || []);
    } catch {
      setError('Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  // Rank by overall activity so the busiest staff sit on top.
  const score = (m: TeamMember) =>
    m.quotations + m.payments + m.customers + m.shipments + m.batches;
  const ranked = [...team].sort((a, b) => score(b) - score(a) || b.collected - a.collected);

  const totals = team.reduce(
    (acc, m) => ({
      quotations: acc.quotations + m.quotations,
      payments: acc.payments + m.payments,
      collected: acc.collected + m.collected,
      customers: acc.customers + m.customers,
      shipments: acc.shipments + m.shipments,
      batches: acc.batches + m.batches,
    }),
    { quotations: 0, payments: 0, collected: 0, customers: 0, shipments: 0, batches: 0 }
  );

  const periodLabel = PERIODS.find(p => p.key === period)?.label || '';

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight flex items-center gap-3">
            <Trophy className="text-[#F15D38]" size={28} /> Team Performance
          </h1>
          <p className="text-slate-400 text-sm font-bold mt-1">
            What each team member did — {periodLabel.toLowerCase()}
          </p>
        </div>
        {/* Period toggle */}
        <div className="flex gap-1 bg-[#131B2E] border border-slate-800 rounded-xl p-1">
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-colors ${
                period === p.key ? 'bg-[#F15D38] text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Company totals */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8">
        {[
          { label: 'Quotations', value: totals.quotations, icon: FileText, color: 'text-[#F15D38]' },
          { label: 'Payments', value: totals.payments, icon: DollarSign, color: 'text-emerald-400' },
          { label: 'Collected', value: `$${totals.collected.toLocaleString()}`, icon: Wallet, color: 'text-emerald-400' },
          { label: 'Customers', value: totals.customers, icon: Users, color: 'text-sky-400' },
          { label: 'Shipments', value: totals.shipments, icon: Ship, color: 'text-teal-400' },
          { label: 'Batches', value: totals.batches, icon: Package, color: 'text-amber-400' },
        ].map(t => (
          <div key={t.label} className="bg-[#131B2E] border border-slate-800 rounded-2xl p-4">
            <t.icon size={18} className={t.color} />
            <p className="text-xl font-black text-slate-100 mt-2">{t.value}</p>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{t.label}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-rose-950/30 border border-rose-800/40 rounded-xl px-4 py-3 mb-6">
          <p className="text-rose-300 text-sm font-bold">{error}</p>
        </div>
      )}

      {loading ? (
        <p className="text-slate-400 text-sm">Loading team report…</p>
      ) : ranked.length === 0 && !error ? (
        <p className="text-slate-400 text-sm">No staff activity yet for this period.</p>
      ) : (
        <div className="space-y-3">
          {ranked.map((m, idx) => {
            const meta = ROLE_META[m.role] ?? ROLE_META['sales_rep'];
            const online = isOnline(m.lastSeen);
            const initials = m.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
            const stats = [
              { label: 'Quotes', value: m.quotations, icon: FileText, color: 'text-[#F15D38]' },
              { label: 'Payments', value: m.payments, icon: DollarSign, color: 'text-emerald-400' },
              { label: 'Collected', value: `$${m.collected.toLocaleString()}`, icon: Wallet, color: 'text-emerald-400' },
              { label: 'Customers', value: m.customers, icon: Users, color: 'text-sky-400' },
              { label: 'Shipments', value: m.shipments, icon: Ship, color: 'text-teal-400' },
              { label: 'Batches', value: m.batches, icon: Package, color: 'text-amber-400' },
            ];

            return (
              <div key={m.id} className="bg-[#131B2E] rounded-2xl p-5 border border-slate-800">
                <div className="flex flex-col lg:flex-row lg:items-center gap-5">
                  {/* Identity */}
                  <div className="flex items-center gap-4 lg:w-72 shrink-0">
                    <span className={`text-sm font-black w-6 text-center ${idx === 0 ? 'text-[#F15D38]' : 'text-slate-600'}`}>
                      {idx + 1}
                    </span>
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-slate-700 bg-slate-800 flex items-center justify-center">
                        {m.photo
                          ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={m.photo} alt={m.name} className="w-full h-full object-cover" />
                          : <span className={`text-sm font-black ${meta.textColor}`}>{initials}</span>}
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#131B2E] ${online ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-100 truncate">{m.name}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-black ${meta.color} ${meta.textColor}`}>
                        {meta.label}
                      </span>
                    </div>
                  </div>

                  {/* Stat tiles */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 flex-1">
                    {stats.map(s => (
                      <div key={s.label} className="bg-slate-900/60 rounded-xl px-3 py-2 text-center">
                        <s.icon size={14} className={`${s.color} mx-auto`} />
                        <p className="text-sm font-black text-slate-100 mt-1 leading-tight">{s.value}</p>
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-wider">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[10px] text-slate-600 mt-6 leading-relaxed">
        Counts reflect activity recorded under each staff member&apos;s login.
        Records created before staff tracking was enabled are credited to the Owner.
      </p>
    </div>
  );
}
