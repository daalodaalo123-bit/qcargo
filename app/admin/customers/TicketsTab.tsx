'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Trash2, X, Loader2, LifeBuoy } from 'lucide-react';

interface Ticket {
  _id: string;
  ticketNumber: string;
  customerName: string;
  customerPhone: string;
  subject: string;
  description: string;
  category: 'DAMAGED' | 'LOST' | 'DELAYED' | 'BILLING' | 'OTHER';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  assignedToName: string;
  createdAt: string;
}

const CATEGORY_LABELS: Record<Ticket['category'], string> = {
  DAMAGED: 'Damaged Cargo', LOST: 'Lost Cargo', DELAYED: 'Delayed', BILLING: 'Billing', OTHER: 'Other',
};
const STATUS_FLOW: Ticket['status'][] = ['OPEN', 'IN_PROGRESS', 'RESOLVED'];
const STATUS_META: Record<Ticket['status'], { label: string; cls: string }> = {
  OPEN:        { label: 'Open',        cls: 'bg-rose-950/30 text-rose-400 border border-rose-800/20' },
  IN_PROGRESS: { label: 'In Progress', cls: 'bg-amber-950/30 text-amber-400 border border-amber-800/20' },
  RESOLVED:    { label: 'Resolved',    cls: 'bg-emerald-950/30 text-emerald-400 border border-emerald-800/20' },
};
const PRIORITY_META: Record<Ticket['priority'], string> = {
  HIGH: 'text-rose-400', MEDIUM: 'text-amber-400', LOW: 'text-slate-400',
};

export default function TicketsTab({ customers }: { customers: { name: string; phone: string }[] }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | Ticket['status']>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<Ticket['category']>('DELAYED');
  const [priority, setPriority] = useState<Ticket['priority']>('MEDIUM');
  const [assignedToName, setAssignedToName] = useState('');
  const [description, setDescription] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await fetch('/api/crm/tickets'); if (res.ok) setTickets(await res.json()); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const reset = () => { setCustomerName(''); setCustomerPhone(''); setSubject(''); setCategory('DELAYED'); setPriority('MEDIUM'); setAssignedToName(''); setDescription(''); };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !subject.trim()) return alert('Customer and subject are required');
    setSaving(true);
    try {
      const res = await fetch('/api/crm/tickets', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName, customerPhone, subject, category, priority, assignedToName, description }),
      });
      if (res.ok) { setShowModal(false); reset(); await load(); }
      else { const d = await res.json().catch(() => ({})); alert(d.error || 'Failed'); }
    } finally { setSaving(false); }
  };

  const setStatus = async (t: Ticket, status: Ticket['status']) => {
    setTickets(prev => prev.map(x => x._id === t._id ? { ...x, status } : x));
    await fetch(`/api/crm/tickets?id=${t._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
  };
  const remove = async (id: string) => {
    if (!confirm('Delete this ticket?')) return;
    setTickets(prev => prev.filter(t => t._id !== id));
    await fetch(`/api/crm/tickets?id=${id}`, { method: 'DELETE' });
  };

  const counts = useMemo(() => ({
    open: tickets.filter(t => t.status === 'OPEN').length,
    progress: tickets.filter(t => t.status === 'IN_PROGRESS').length,
    resolved: tickets.filter(t => t.status === 'RESOLVED').length,
  }), [tickets]);
  const shown = filter === 'ALL' ? tickets : tickets.filter(t => t.status === filter);

  const field = 'w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#F15D38]';
  const lbl = 'block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2';

  return (
    <div className="animate-in fade-in duration-300 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-[#F15D38] text-white' : 'text-slate-400 hover:text-slate-200'}`}>
              {f === 'ALL' ? `All (${tickets.length})` : f === 'OPEN' ? `Open (${counts.open})` : f === 'IN_PROGRESS' ? `In Progress (${counts.progress})` : `Resolved (${counts.resolved})`}
            </button>
          ))}
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary flex items-center gap-2 shadow-lg shadow-[#F15D38]/20"><Plus size={15} /> New Ticket</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-[#F15D38]" /></div>
      ) : shown.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <LifeBuoy size={40} className="mx-auto mb-4 opacity-30" />
          <p className="text-sm font-bold">No tickets here.</p>
          <p className="text-xs mt-1">Log a customer complaint with the New Ticket button.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map(t => (
            <div key={t._id} className={`shipment-card border py-4 ${t.status === 'RESOLVED' ? 'opacity-60 border-slate-800' : 'border-slate-800'}`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[10px] font-black text-[#F15D38]">{t.ticketNumber}</span>
                    <span className="text-sm font-black text-slate-100">{t.subject}</span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${STATUS_META[t.status].cls}`}>{STATUS_META[t.status].label}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap text-[11px] font-bold text-slate-400">
                    <span className="text-slate-200">{t.customerName}</span>
                    {t.customerPhone && <span className="font-mono text-slate-500">{t.customerPhone}</span>}
                    <span className="text-slate-500">· {CATEGORY_LABELS[t.category]}</span>
                    <span className={PRIORITY_META[t.priority]}>· {t.priority}</span>
                    {t.assignedToName && <span className="text-slate-500">· @{t.assignedToName}</span>}
                  </div>
                  {t.description && <p className="text-xs text-slate-400 mt-2">{t.description}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {STATUS_FLOW.filter(s => s !== t.status).map(s => (
                    <button key={s} onClick={() => setStatus(t, s)}
                      className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors">
                      → {STATUS_META[s].label}
                    </button>
                  ))}
                  <button onClick={() => remove(t._id)} className="p-2 text-slate-600 hover:text-rose-400 rounded-lg"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0B0F19] border border-slate-800 rounded-3xl w-full max-w-lg p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-100">New Complaint / Ticket</h3>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-200 rounded-lg"><X size={18} /></button>
            </div>
            <form onSubmit={create} className="space-y-4">
              <div>
                <label className={lbl}>Customer</label>
                <input list="ticket-customers" className={field} value={customerName}
                  onChange={e => { setCustomerName(e.target.value); const m = customers.find(c => c.name === e.target.value); if (m) setCustomerPhone(m.phone); }}
                  placeholder="Customer name" required />
                <datalist id="ticket-customers">{customers.map(c => <option key={c.name + c.phone} value={c.name} />)}</datalist>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={lbl}>Phone</label><input className={field} value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="+252 …" /></div>
                <div><label className={lbl}>Assign to</label><input className={field} value={assignedToName} onChange={e => setAssignedToName(e.target.value)} placeholder="Staff name" /></div>
              </div>
              <div><label className={lbl}>Subject</label><input className={field} value={subject} onChange={e => setSubject(e.target.value)} placeholder="Short summary" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={lbl}>Category</label>
                  <select className={`${field} bg-[#0B0F19]`} value={category} onChange={e => setCategory(e.target.value as Ticket['category'])}>
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div><label className={lbl}>Priority</label>
                  <select className={`${field} bg-[#0B0F19]`} value={priority} onChange={e => setPriority(e.target.value as Ticket['priority'])}>
                    <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option>
                  </select>
                </div>
              </div>
              <div><label className={lbl}>Details</label><textarea className={`${field} resize-none`} rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="What happened?" /></div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn bg-[#131B2E] border border-slate-800 text-slate-300 px-6">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary px-8 flex items-center gap-2">{saving && <Loader2 size={14} className="animate-spin" />}Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
