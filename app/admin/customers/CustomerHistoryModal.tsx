'use client';

import { useState, useEffect } from 'react';
import {
  X, User, Phone, MapPin, Loader2, FileText, Ship, Receipt, Wallet,
  MessageSquare, Bell, Plus, Trash2, CheckCircle2, Clock,
} from 'lucide-react';

interface QuotationRow { _id: string; goods: string; type: 'AIR' | 'SEA'; status: string; paymentStatus: string; price: number; amountPaid: number; date: string; }
interface ShipmentRow  { _id: string; shipmentNumber: string; type: 'AIR' | 'SEA'; status: string; paymentStatus: string; total: number; amountPaid: number; batch: string; date: string; }
interface InvoiceRow   { _id: string; invoiceNumber: string; totalAmount: number; amountPaid: number; paymentMethod: string; paymentStatus: string; paymentDate: string; }
interface NoteRow      { _id: string; type: 'NOTE' | 'CALL' | 'MEETING' | 'COMPLAINT'; text: string; createdAt: string; }
interface FollowUpRow  { _id: string; dueDate: string; note: string; status: 'PENDING' | 'DONE'; createdAt: string; }

interface HistoryData {
  customer: { name: string; phone: string; city?: string; status?: string; };
  quotations: QuotationRow[];
  shipments: ShipmentRow[];
  invoices: InvoiceRow[];
  summary: { totalQuotations: number; totalShipments: number; totalQuoted: number; totalShipped: number; totalPaid: number; balanceDue: number; };
}

interface Props { customerId: string | null; onClose: () => void; }

const STATUS_STYLES: Record<string, string> = {
  APPROVED: 'bg-emerald-950/30 text-emerald-400 border border-emerald-800/20',
  SENT: 'bg-[#F15D38]/15 text-[#F15D38] border border-[#F15D38]/20',
  REJECTED: 'bg-rose-950/30 text-rose-400 border border-rose-800/20',
  DRAFT: 'bg-slate-900 text-slate-400 border border-slate-800',
  PENDING: 'bg-amber-950/30 text-amber-400 border border-amber-800/20',
  IN_TRANSIT: 'bg-blue-950/30 text-blue-400 border border-blue-800/20',
  ARRIVED: 'bg-emerald-950/30 text-emerald-400 border border-emerald-800/20',
  PAID: 'bg-emerald-950/30 text-emerald-400 border border-emerald-800/20',
  PARTIAL: 'bg-amber-950/30 text-amber-400 border border-amber-800/20',
  UNPAID: 'bg-rose-950/30 text-rose-400 border border-rose-800/20',
};

const NOTE_TYPE_STYLES: Record<string, string> = {
  NOTE:      'bg-slate-900 text-slate-400 border border-slate-800',
  CALL:      'bg-blue-950/30 text-blue-400 border border-blue-800/20',
  MEETING:   'bg-emerald-950/30 text-emerald-400 border border-emerald-800/20',
  COMPLAINT: 'bg-rose-950/30 text-rose-400 border border-rose-800/20',
};

type Tab = 'history' | 'notes' | 'followups';

export default function CustomerHistoryModal({ customerId, onClose }: Props) {
  const [data, setData]           = useState<HistoryData | null>(null);
  const [loading, setLoading]     = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('history');

  // Notes state
  const [notes, setNotes]         = useState<NoteRow[]>([]);
  const [noteType, setNoteType]   = useState<'NOTE' | 'CALL' | 'MEETING' | 'COMPLAINT'>('NOTE');
  const [noteText, setNoteText]   = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Follow-ups state
  const [followups, setFollowups]   = useState<FollowUpRow[]>([]);
  const [fuDate, setFuDate]         = useState('');
  const [fuNote, setFuNote]         = useState('');
  const [savingFu, setSavingFu]     = useState(false);

  const [customerName, setCustomerName] = useState('');

  useEffect(() => {
    if (!customerId) return;
    setLoading(true);
    setData(null);
    setNotes([]);
    setFollowups([]);
    setActiveTab('history');

    Promise.all([
      fetch(`/api/customers/${customerId}/history`).then(r => r.json()),
      fetch(`/api/crm/notes?customerId=${customerId}`).then(r => r.json()),
      fetch(`/api/crm/followups?customerId=${customerId}`).then(r => r.json()),
    ]).then(([hist, n, fu]) => {
      setData(hist);
      setCustomerName(hist?.customer?.name || '');
      setNotes(Array.isArray(n) ? n : []);
      setFollowups(Array.isArray(fu) ? fu : []);
    }).finally(() => setLoading(false));
  }, [customerId]);

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim() || !customerId) return;
    setSavingNote(true);
    try {
      const res = await fetch('/api/crm/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, customerName, type: noteType, text: noteText.trim() }),
      });
      const saved = await res.json();
      setNotes(prev => [saved, ...prev]);
      setNoteText('');
    } finally { setSavingNote(false); }
  };

  const deleteNote = async (id: string) => {
    await fetch(`/api/crm/notes?id=${id}`, { method: 'DELETE' });
    setNotes(prev => prev.filter(n => n._id !== id));
  };

  const addFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fuDate || !fuNote.trim() || !customerId) return;
    setSavingFu(true);
    try {
      const res = await fetch('/api/crm/followups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, customerName, dueDate: fuDate, note: fuNote.trim() }),
      });
      const saved = await res.json();
      setFollowups(prev => [...prev, saved].sort((a, b) => a.dueDate.localeCompare(b.dueDate)));
      setFuDate(''); setFuNote('');
    } finally { setSavingFu(false); }
  };

  const toggleFollowUp = async (fu: FollowUpRow) => {
    const newStatus = fu.status === 'DONE' ? 'PENDING' : 'DONE';
    await fetch(`/api/crm/followups?id=${fu._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    setFollowups(prev => prev.map(f => f._id === fu._id ? { ...f, status: newStatus } : f));
  };

  const deleteFollowUp = async (id: string) => {
    await fetch(`/api/crm/followups?id=${id}`, { method: 'DELETE' });
    setFollowups(prev => prev.filter(f => f._id !== id));
  };

  const today = new Date().toISOString().split('T')[0];

  if (!customerId) return null;

  const TABS: { id: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'history',   label: 'History',    icon: Ship,         count: data ? data.summary.totalShipments : undefined },
    { id: 'notes',     label: 'Notes',      icon: MessageSquare, count: notes.length },
    { id: 'followups', label: 'Follow-ups', icon: Bell,          count: followups.filter(f => f.status === 'PENDING').length },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-4xl bg-[#131B2E] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0B0F19] shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#F15D38]/10 text-[#F15D38]"><User size={18} /></div>
            <div>
              <h2 className="text-sm font-black text-slate-100 uppercase tracking-wider">Customer Profile</h2>
              {data && <p className="text-[10px] text-slate-500 font-bold">{data.customer.name}</p>}
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-200 rounded-lg"><X size={18} /></button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-[#F15D38]" /></div>
        ) : !data ? (
          <div className="p-10 text-center text-sm text-slate-400 font-bold">Failed to load customer data.</div>
        ) : (
          <>
            {/* Customer info + summary */}
            <div className="px-6 py-4 border-b border-slate-800 bg-[#0B0F19]/50 shrink-0">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="flex items-center gap-2 text-slate-300"><Phone size={13} className="text-slate-500" /><span className="text-xs font-bold">{data.customer.phone}</span></div>
                <div className="flex items-center gap-2 text-slate-400"><MapPin size={13} className="text-slate-500" /><span className="text-xs font-bold">{data.customer.city || 'Hargeisa'}</span></div>
                {data.customer.status && (
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full ${data.customer.status === 'VIP' ? 'bg-amber-950/30 text-amber-400 border border-amber-800/20' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}>{data.customer.status}</span>
                )}
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Quotations',   value: data.summary.totalQuotations },
                  { label: 'Shipments',    value: data.summary.totalShipments },
                  { label: 'Total Paid',   value: `$${data.summary.totalPaid.toFixed(2)}`,   cls: 'text-emerald-400' },
                  { label: 'Balance Due',  value: `$${data.summary.balanceDue.toFixed(2)}`, cls: data.summary.balanceDue > 0 ? 'text-rose-400' : 'text-emerald-400' },
                ].map(s => (
                  <div key={s.label} className="p-3 rounded-xl bg-[#0B0F19] border border-slate-800">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{s.label}</p>
                    <p className={`text-lg font-black ${s.cls || 'text-slate-100'}`}>{s.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-6 pt-4 shrink-0">
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-[#F15D38] text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
                  <tab.icon size={13} />{tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${activeTab === tab.id ? 'bg-white/20' : 'bg-slate-800'}`}>{tab.count}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="overflow-y-auto flex-1 p-6">

              {/* ── HISTORY TAB ── */}
              {activeTab === 'history' && (
                <div className="space-y-6">
                  {/* Quotations */}
                  <div>
                    <div className="flex items-center gap-2 mb-2"><FileText size={14} className="text-[#F15D38]" /><h3 className="text-xs font-black text-slate-300 uppercase tracking-wider">Quotations ({data.quotations.length})</h3></div>
                    {data.quotations.length === 0 ? <p className="text-xs text-slate-500 font-bold px-2">No quotations.</p> : (
                      <div className="border border-slate-800 rounded-xl overflow-hidden">
                        <table className="w-full text-left">
                          <thead><tr className="bg-slate-900/60 border-b border-slate-800">{['Date','Goods','Status','Payment','Total'].map(h => <th key={h} className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">{h}</th>)}</tr></thead>
                          <tbody className="divide-y divide-slate-800">
                            {data.quotations.map(q => (
                              <tr key={q._id}>
                                <td className="px-4 py-2.5 text-xs font-bold text-slate-400">{q.date}</td>
                                <td className="px-4 py-2.5 text-xs font-bold text-slate-200">{q.goods}</td>
                                <td className="px-4 py-2.5"><span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${STATUS_STYLES[q.status] || STATUS_STYLES.DRAFT}`}>{q.status}</span></td>
                                <td className="px-4 py-2.5"><span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${STATUS_STYLES[q.paymentStatus] || STATUS_STYLES.UNPAID}`}>{q.paymentStatus}</span></td>
                                <td className="px-4 py-2.5 text-xs font-black text-slate-100">${q.price.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Shipments */}
                  <div>
                    <div className="flex items-center gap-2 mb-2"><Ship size={14} className="text-[#F15D38]" /><h3 className="text-xs font-black text-slate-300 uppercase tracking-wider">Shipments ({data.shipments.length})</h3></div>
                    {data.shipments.length === 0 ? <p className="text-xs text-slate-500 font-bold px-2">No shipments.</p> : (
                      <div className="border border-slate-800 rounded-xl overflow-hidden">
                        <table className="w-full text-left">
                          <thead><tr className="bg-slate-900/60 border-b border-slate-800">{['Shipment #','Date','Batch','Status','Payment','Total'].map(h => <th key={h} className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">{h}</th>)}</tr></thead>
                          <tbody className="divide-y divide-slate-800">
                            {data.shipments.map(s => (
                              <tr key={s._id}>
                                <td className="px-4 py-2.5 text-xs font-black text-slate-100 font-mono">{s.shipmentNumber}</td>
                                <td className="px-4 py-2.5 text-xs font-bold text-slate-400">{s.date}</td>
                                <td className="px-4 py-2.5 text-xs font-bold text-slate-400">{s.batch}</td>
                                <td className="px-4 py-2.5"><span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${STATUS_STYLES[s.status] || STATUS_STYLES.PENDING}`}>{s.status}</span></td>
                                <td className="px-4 py-2.5"><span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${STATUS_STYLES[s.paymentStatus] || STATUS_STYLES.UNPAID}`}>{s.paymentStatus}</span></td>
                                <td className="px-4 py-2.5 text-xs font-black text-slate-100">${(s.total || 0).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Invoices */}
                  <div>
                    <div className="flex items-center gap-2 mb-2"><Wallet size={14} className="text-[#F15D38]" /><h3 className="text-xs font-black text-slate-300 uppercase tracking-wider">Payments ({data.invoices.length})</h3></div>
                    {data.invoices.length === 0 ? <p className="text-xs text-slate-500 font-bold px-2">No payments recorded.</p> : (
                      <div className="border border-slate-800 rounded-xl overflow-hidden">
                        <table className="w-full text-left">
                          <thead><tr className="bg-slate-900/60 border-b border-slate-800">{['Receipt #','Date','Method','Status','Paid'].map(h => <th key={h} className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">{h}</th>)}</tr></thead>
                          <tbody className="divide-y divide-slate-800">
                            {data.invoices.map(inv => (
                              <tr key={inv._id}>
                                <td className="px-4 py-2.5 text-xs font-black text-slate-100 font-mono"><span className="inline-flex items-center gap-1.5"><Receipt size={12} className="text-slate-500" />{inv.invoiceNumber}</span></td>
                                <td className="px-4 py-2.5 text-xs font-bold text-slate-400">{inv.paymentDate}</td>
                                <td className="px-4 py-2.5 text-xs font-bold text-slate-300">{inv.paymentMethod}</td>
                                <td className="px-4 py-2.5"><span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${STATUS_STYLES[inv.paymentStatus] || STATUS_STYLES.UNPAID}`}>{inv.paymentStatus}</span></td>
                                <td className="px-4 py-2.5 text-xs font-black text-emerald-400">${(inv.amountPaid || 0).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── NOTES TAB ── */}
              {activeTab === 'notes' && (
                <div className="space-y-5">
                  <form onSubmit={addNote} className="bg-[#0B0F19] border border-slate-800 rounded-2xl p-5 space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Add Interaction</p>
                    <div className="flex gap-2">
                      {(['NOTE','CALL','MEETING','COMPLAINT'] as const).map(t => (
                        <button key={t} type="button" onClick={() => setNoteType(t)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${noteType === t ? 'bg-[#F15D38] text-white' : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'}`}>
                          {t}
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={noteText}
                      onChange={e => setNoteText(e.target.value)}
                      placeholder="Write your note here..."
                      rows={3}
                      required
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#F15D38] resize-none"
                    />
                    <div className="flex justify-end">
                      <button type="submit" disabled={savingNote}
                        className="flex items-center gap-2 px-5 py-2 bg-[#F15D38] text-white text-xs font-black rounded-xl hover:bg-[#d94f2e] disabled:opacity-50 transition-colors">
                        {savingNote ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                        Save Note
                      </button>
                    </div>
                  </form>

                  {notes.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">
                      <MessageSquare size={32} className="mx-auto mb-3 opacity-30" />
                      <p className="text-xs font-bold">No notes yet. Log the first interaction above.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {notes.map(note => (
                        <div key={note._id} className="bg-[#0B0F19] border border-slate-800 rounded-xl p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${NOTE_TYPE_STYLES[note.type]}`}>{note.type}</span>
                              <span className="text-[10px] font-bold text-slate-500">{new Date(note.createdAt).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}</span>
                            </div>
                            <button onClick={() => deleteNote(note._id)} className="p-1.5 text-slate-600 hover:text-rose-400 rounded-lg transition-colors shrink-0"><Trash2 size={13} /></button>
                          </div>
                          <p className="text-sm text-slate-300 leading-relaxed">{note.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── FOLLOW-UPS TAB ── */}
              {activeTab === 'followups' && (
                <div className="space-y-5">
                  <form onSubmit={addFollowUp} className="bg-[#0B0F19] border border-slate-800 rounded-2xl p-5 space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Set Follow-up Reminder</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Due Date</label>
                        <input type="date" value={fuDate} onChange={e => setFuDate(e.target.value)} required min={today}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-100 focus:outline-none focus:border-[#F15D38]" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Reminder Note</label>
                        <input type="text" value={fuNote} onChange={e => setFuNote(e.target.value)} required placeholder="e.g. Call about payment"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-100 focus:outline-none focus:border-[#F15D38]" />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button type="submit" disabled={savingFu}
                        className="flex items-center gap-2 px-5 py-2 bg-[#F15D38] text-white text-xs font-black rounded-xl hover:bg-[#d94f2e] disabled:opacity-50 transition-colors">
                        {savingFu ? <Loader2 size={13} className="animate-spin" /> : <Bell size={13} />}
                        Set Reminder
                      </button>
                    </div>
                  </form>

                  {followups.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">
                      <Bell size={32} className="mx-auto mb-3 opacity-30" />
                      <p className="text-xs font-bold">No follow-ups set.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {followups.map(fu => {
                        const isOverdue = fu.status === 'PENDING' && fu.dueDate < today;
                        const isToday   = fu.dueDate === today;
                        return (
                          <div key={fu._id} className={`border rounded-xl p-4 flex items-start gap-3 ${fu.status === 'DONE' ? 'border-slate-800/40 opacity-50' : isOverdue ? 'border-rose-800/40 bg-rose-950/10' : isToday ? 'border-amber-800/40 bg-amber-950/10' : 'border-slate-800 bg-[#0B0F19]'}`}>
                            <button onClick={() => toggleFollowUp(fu)} className="shrink-0 mt-0.5">
                              {fu.status === 'DONE'
                                ? <CheckCircle2 size={18} className="text-emerald-500" />
                                : <Clock size={18} className={isOverdue ? 'text-rose-400' : isToday ? 'text-amber-400' : 'text-slate-500'} />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] font-black ${isOverdue ? 'text-rose-400' : isToday ? 'text-amber-400' : 'text-slate-400'}`}>
                                  {isOverdue ? 'OVERDUE · ' : isToday ? 'TODAY · ' : ''}{fu.dueDate}
                                </span>
                              </div>
                              <p className={`text-sm font-bold ${fu.status === 'DONE' ? 'line-through text-slate-500' : 'text-slate-200'}`}>{fu.note}</p>
                            </div>
                            <button onClick={() => deleteFollowUp(fu._id)} className="p-1.5 text-slate-600 hover:text-rose-400 rounded-lg transition-colors shrink-0"><Trash2 size={13} /></button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
