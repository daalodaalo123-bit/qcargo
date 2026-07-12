'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Search, Pencil, Trash2, X, MapPin, Phone, MessageCircle,
  ExternalLink, Building2, Package, Copy, Check, Loader2, User, ShieldCheck,
} from 'lucide-react';

interface Supplier {
  _id: string;
  name: string;
  location: string;
  products: string;
  wechat: string;
  phone: string;
  whatsapp: string;
  storeLink: string;
  contactPerson: string;
  notes: string;
  verificationStatus?: 'NOT_VERIFIED' | 'DOCS_REQUESTED' | 'VERIFIED';
}

const VERIFY_BADGE: Record<string, { label: string; cls: string }> = {
  NOT_VERIFIED: { label: 'Not Verified', cls: 'bg-slate-800 text-slate-500 border-slate-700' },
  DOCS_REQUESTED: { label: 'Docs Requested', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  VERIFIED: { label: 'Verified', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
};

interface OrderLite { supplier: string; totalUSD: number; date: string; }

const BLANK = { name: '', location: '', products: '', wechat: '', phone: '', whatsapp: '', storeLink: '', contactPerson: '', notes: '' };

function WeChatCopy({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(id); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300" title="Copy WeChat ID">
      <MessageCircle size={12} /> {id} {copied ? <Check size={11} /> : <Copy size={11} />}
    </button>
  );
}

export default function SuppliersTab() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [orders, setOrders] = useState<OrderLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, oRes] = await Promise.all([fetch('/api/suppliers'), fetch('/api/sourcing')]);
      if (sRes.ok) setSuppliers(await sRes.json());
      if (oRes.ok) { const d = await oRes.json(); setOrders(Array.isArray(d) ? d : []); }
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  // Order history per supplier (matched by name).
  const historyOf = useMemo(() => {
    const map: Record<string, { total: number; count: number; first: string; last: string }> = {};
    for (const o of orders) {
      const key = (o.supplier || '').toLowerCase();
      if (!key) continue;
      if (!map[key]) map[key] = { total: 0, count: 0, first: o.date, last: o.date };
      map[key].total += o.totalUSD || 0;
      map[key].count += 1;
      if (o.date < map[key].first) map[key].first = o.date;
      if (o.date > map[key].last) map[key].last = o.date;
    }
    return map;
  }, [orders]);

  const openAdd = () => { setEditingId(null); setForm(BLANK); setShowModal(true); };
  const openEdit = (s: Supplier) => { setEditingId(s._id); setForm({ name: s.name, location: s.location, products: s.products, wechat: s.wechat, phone: s.phone, whatsapp: s.whatsapp, storeLink: s.storeLink, contactPerson: s.contactPerson, notes: s.notes }); setShowModal(true); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return alert('Supplier name is required');
    setSaving(true);
    try {
      const url = editingId ? `/api/suppliers?id=${editingId}` : '/api/suppliers';
      const res = await fetch(url, { method: editingId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (res.ok) { setShowModal(false); await load(); }
      else { const d = await res.json().catch(() => ({})); alert(d.error || 'Failed'); }
    } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this supplier? (Their past orders stay.)')) return;
    setSuppliers(prev => prev.filter(s => s._id !== id));
    await fetch(`/api/suppliers?id=${id}`, { method: 'DELETE' });
  };

  const money = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  const q = search.toLowerCase();
  const shown = suppliers.filter(s =>
    s.name.toLowerCase().includes(q) || s.products.toLowerCase().includes(q) || s.location.toLowerCase().includes(q));

  const field = 'w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#F15D38]';
  const lbl = 'block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5';

  return (
    <div className="animate-in fade-in duration-300 space-y-5">
      <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#F15D38]" size={18} />
          <input className="search-input !pl-12 w-full" placeholder="Search by name, product, or city…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button onClick={openAdd} className="btn btn-primary flex items-center gap-2 shadow-lg shadow-[#F15D38]/20 whitespace-nowrap"><Plus size={16} /> Add Supplier</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-[#F15D38]" /></div>
      ) : shown.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Building2 size={40} className="mx-auto mb-4 opacity-30" />
          <p className="text-sm font-bold">No suppliers yet.</p>
          <p className="text-xs mt-1">Add your China suppliers, or they get added automatically when you create orders.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {shown.map(s => {
            const h = historyOf[s.name.toLowerCase()];
            const badge = VERIFY_BADGE[s.verificationStatus || 'NOT_VERIFIED'] || VERIFY_BADGE.NOT_VERIFIED;
            return (
              <div key={s._id} onClick={() => router.push(`/admin/purchases/suppliers/${s._id}`)}
                className="shipment-card border border-slate-800 bg-[#131B2E] cursor-pointer hover:border-slate-600 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-[#F15D38]/10 border border-[#F15D38]/20 flex items-center justify-center text-[#F15D38] shrink-0"><Building2 size={16} /></div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="font-black text-slate-100 truncate">{s.name}</p>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border shrink-0 flex items-center gap-1 ${badge.cls}`}>
                            {s.verificationStatus === 'VERIFIED' && <ShieldCheck size={10} />}{badge.label}
                          </span>
                        </div>
                        {s.location && <p className="text-[11px] font-bold text-slate-500 flex items-center gap-1"><MapPin size={10} />{s.location}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openEdit(s)} className="p-1.5 text-slate-500 hover:text-slate-200 rounded-lg"><Pencil size={14} /></button>
                    <button onClick={() => remove(s._id)} className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg"><Trash2 size={14} /></button>
                  </div>
                </div>

                {s.products && (
                  <p className="text-[11px] font-bold text-slate-400 mt-3 flex items-center gap-1.5"><Package size={12} className="text-slate-500" /> {s.products}</p>
                )}

                {/* Contact row */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3" onClick={e => e.stopPropagation()}>
                  {s.wechat && <WeChatCopy id={s.wechat} />}
                  {s.phone && <a href={`tel:${s.phone}`} className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-300 hover:text-white"><Phone size={11} />{s.phone}</a>}
                  {s.whatsapp && <a href={`https://wa.me/${s.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300"><MessageCircle size={11} />WhatsApp</a>}
                  {s.storeLink && <a href={s.storeLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-400 hover:text-sky-300"><ExternalLink size={11} />Store</a>}
                  {s.contactPerson && <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400"><User size={11} />{s.contactPerson}</span>}
                </div>

                {s.notes && <p className="text-[11px] text-slate-500 mt-2 border-t border-slate-800/60 pt-2">{s.notes}</p>}

                {/* Order history */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800/60">
                  <div><p className="text-[9px] font-black text-slate-500 uppercase">Bought</p><p className="text-sm font-black text-emerald-400">{h ? money(h.total) : '$0'}</p></div>
                  <div><p className="text-[9px] font-black text-slate-500 uppercase">Orders</p><p className="text-sm font-black text-slate-100">{h ? h.count : 0}</p></div>
                  <div><p className="text-[9px] font-black text-slate-500 uppercase">Since</p><p className="text-sm font-black text-slate-100">{h ? h.first : '—'}</p></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0B0F19] border border-slate-800 rounded-3xl w-full max-w-lg p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-100">{editingId ? 'Edit Supplier' : 'Add Supplier'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-200 rounded-lg"><X size={18} /></button>
            </div>
            <form onSubmit={save} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className={lbl}>Company name *</label><input className={field} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Guangzhou Electronics" required /></div>
                <div><label className={lbl}>Location (city)</label><input className={field} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Guangzhou" /></div>
              </div>
              <div><label className={lbl}>What they sell</label><input className={field} value={form.products} onChange={e => setForm({ ...form, products: e.target.value })} placeholder="e.g. electronics, watches, bags" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={lbl}>WeChat ID</label><input className={field} value={form.wechat} onChange={e => setForm({ ...form, wechat: e.target.value })} placeholder="wechat_id" /></div>
                <div><label className={lbl}>Phone</label><input className={field} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+86 …" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={lbl}>WhatsApp</label><input className={field} value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} placeholder="+86 …" /></div>
                <div><label className={lbl}>Contact person</label><input className={field} value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} placeholder="Salesperson name" /></div>
              </div>
              <div><label className={lbl}>Store link (Alibaba / Taobao)</label><input className={field} value={form.storeLink} onChange={e => setForm({ ...form, storeLink: e.target.value })} placeholder="https://…" /></div>
              <div><label className={lbl}>Notes</label><textarea className={`${field} resize-none`} rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Quality, prices, terms…" /></div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn bg-[#131B2E] border border-slate-800 text-slate-300 px-6">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary px-8 flex items-center gap-2">{saving && <Loader2 size={14} className="animate-spin" />}Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
