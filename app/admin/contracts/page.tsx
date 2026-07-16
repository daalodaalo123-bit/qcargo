'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  FileSignature, Search, Plus, Download, Send, Trash2, X, Loader2,
  Clock, FileCheck, Ship, Plane, FileText, Pencil, RotateCcw,
} from 'lucide-react';

interface ContractItem { description: string; qty: number; price: number; }
interface TermSection { heading: string; body: string; }
interface Contract {
  _id: string;
  ref: string;
  customer: string;
  phone?: string;
  email?: string;
  deliveryTo?: string;
  deliveryPhone?: string;
  deliveryEmail?: string;
  freightType: 'AIR' | 'SEA';
  items: ContractItem[];
  subtotal: number;
  commissionRate: number;
  commissionAmount: number;
  total: number;
  amountPaid?: number;
  balanceDue?: number;
  paymentStatus?: 'UNPAID' | 'PARTIAL' | 'PAID';
  receiptNo?: string;
  paymentMethod?: string;
  paymentDate?: string;
  issuedDate: string;
  quotationDate?: string;
  terms?: TermSection[];
  status: 'DRAFT' | 'SENT' | 'SIGNED';
  pdfUrl?: string;
  createdAt?: string;
}
interface CustomerLite { _id: string; name: string; phone: string }
interface QuotationLite {
  _id: string;
  customer: string;
  phone?: string;
  date: string;
  type: 'AIR' | 'SEA';
  price: number;
  amountPaid: number;
  paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID';
  commissionRate: number;
  items: { description: string; qty: number; price: number }[];
}

const quoteRef = (id: string) => `QT-${id.slice(-8).toUpperCase()}`;

const money = (n: number) => `$${(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (iso?: string) => {
  if (!iso) return '—';
  try { return new Date(iso.includes('T') ? iso : `${iso}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return iso; }
};

const STATUS_STYLES: Record<Contract['status'], string> = {
  DRAFT: 'bg-slate-700/40 text-slate-300 border-slate-600/40',
  SENT: 'bg-amber-950/40 text-amber-300 border-amber-700/40',
  SIGNED: 'bg-emerald-950/40 text-emerald-300 border-emerald-700/40',
};

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [customers, setCustomers] = useState<CustomerLite[]>([]);
  const [quotations, setQuotations] = useState<QuotationLite[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | Contract['status']>('ALL');
  const [loading, setLoading] = useState(true);

  // New-contract (standalone) modal
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nCustomer, setNCustomer] = useState('');
  const [nPhone, setNPhone] = useState('');
  const [nEmail, setNEmail] = useState('');
  const [nDelivery, setNDelivery] = useState('');
  const [nDeliveryPhone, setNDeliveryPhone] = useState('');
  const [nDeliveryEmail, setNDeliveryEmail] = useState('');
  const [nFreight, setNFreight] = useState<'AIR' | 'SEA'>('SEA');
  const [nCommission, setNCommission] = useState('10');
  const [nItems, setNItems] = useState<ContractItem[]>([{ description: '', qty: 1, price: 0 }]);
  const [nAmountPaid, setNAmountPaid] = useState('0');
  const [nQuotationId, setNQuotationId] = useState('');   // linked quotation, if loaded from one

  // Send modal
  const [sendContract, setSendContract] = useState<Contract | null>(null);
  const [sendPhone, setSendPhone] = useState('');
  const [sending, setSending] = useState(false);

  // Edit modal — every field of the agreement, including the terms text
  const [editC, setEditC] = useState<Contract | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [eSaving, setESaving] = useState(false);
  const [eCustomer, setECustomer] = useState('');
  const [ePhone, setEPhone] = useState('');
  const [eEmail, setEEmail] = useState('');
  const [eDelivery, setEDelivery] = useState('');
  const [eDeliveryPhone, setEDeliveryPhone] = useState('');
  const [eDeliveryEmail, setEDeliveryEmail] = useState('');
  const [eFreight, setEFreight] = useState<'AIR' | 'SEA'>('SEA');
  const [eCommission, setECommission] = useState('10');
  const [eItems, setEItems] = useState<ContractItem[]>([{ description: '', qty: 1, price: 0 }]);
  const [eAmountPaid, setEAmountPaid] = useState('0');
  const [eReceiptNo, setEReceiptNo] = useState('');
  const [ePayMethod, setEPayMethod] = useState('');
  const [ePayDate, setEPayDate] = useState('');
  const [eIssuedDate, setEIssuedDate] = useState('');
  const [eTerms, setETerms] = useState<TermSection[]>([]);
  const [eDefaultTerms, setEDefaultTerms] = useState<TermSection[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const [cRes, custRes, qRes] = await Promise.all([fetch('/api/contracts'), fetch('/api/customers'), fetch('/api/quotations')]);
      if (cRes.ok) setContracts(await cRes.json());
      if (custRes.ok) {
        const data = await custRes.json();
        setCustomers(data.map((c: { _id?: string; id?: string; name: string; phone: string }) => ({ _id: c._id || c.id, name: c.name, phone: c.phone })));
      }
      if (qRes.ok) {
        const data = await qRes.json();
        setQuotations(data.map((q: Record<string, unknown>) => ({
          _id: String(q._id),
          customer: String(q.customer || ''),
          phone: q.phone ? String(q.phone) : '',
          date: String(q.date || ''),
          type: (q.type as 'AIR' | 'SEA') || 'SEA',
          price: Number(q.price) || 0,
          amountPaid: Number(q.amountPaid) || 0,
          paymentStatus: (q.paymentStatus as QuotationLite['paymentStatus']) || 'UNPAID',
          commissionRate: Number(q.commissionRate) || 10,
          items: Array.isArray(q.items)
            ? (q.items as { description?: string; qty?: number; price?: number }[]).map(it => ({ description: it.description || '', qty: Number(it.qty) || 1, price: Number(it.price) || 0 }))
            : [],
        })));
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const digits = searchTerm.replace(/\D/g, '');
    return contracts.filter(c =>
      (statusFilter === 'ALL' || c.status === statusFilter) &&
      (c.customer.toLowerCase().includes(term) ||
       c.ref.toLowerCase().includes(term) ||
       (!!digits && (c.phone || '').replace(/\D/g, '').includes(digits)))
    );
  }, [contracts, searchTerm, statusFilter]);

  const stats = useMemo(() => ({
    total: contracts.length,
    draft: contracts.filter(c => c.status === 'DRAFT').length,
    sent: contracts.filter(c => c.status === 'SENT').length,
    signed: contracts.filter(c => c.status === 'SIGNED').length,
  }), [contracts]);

  // ── standalone create ──
  const nSubtotal = nItems.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);
  const nCommAmt = +(nSubtotal * ((Number(nCommission) || 0) / 100)).toFixed(2);
  const nTotal = +(nSubtotal + nCommAmt).toFixed(2);
  const nPaid = Math.min(Math.max(0, Number(nAmountPaid) || 0), nTotal);
  const nBalance = +Math.max(0, nTotal - nPaid).toFixed(2);

  // Quotations belonging to the currently-selected customer, newest first.
  const customerQuotes = useMemo(() => {
    const name = nCustomer.trim().toLowerCase();
    if (!name) return [];
    return quotations
      .filter(q => q.customer.toLowerCase() === name)
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [quotations, nCustomer]);

  const resetNew = () => {
    setNCustomer(''); setNPhone(''); setNEmail(''); setNDelivery('');
    setNDeliveryPhone(''); setNDeliveryEmail('');
    setNFreight('SEA'); setNCommission('10'); setNItems([{ description: '', qty: 1, price: 0 }]);
    setNAmountPaid('0'); setNQuotationId('');
  };

  // Fill the form from a quotation (goods, prices, freight, commission, phone, payment).
  const applyQuotation = (q: QuotationLite) => {
    setNQuotationId(q._id);
    setNFreight(q.type);
    setNCommission(String(q.commissionRate));
    if (q.phone) setNPhone(q.phone);
    setNItems(q.items.length ? q.items.map(it => ({ description: it.description, qty: it.qty, price: it.price })) : [{ description: '', qty: 1, price: 0 }]);
    setNAmountPaid(String(q.amountPaid || 0));
  };

  const onCustomerPick = (name: string) => {
    setNCustomer(name);
    const match = customers.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (match) setNPhone(match.phone);
    // "Both": if the customer has quotations, pre-load the latest so it's filled by default.
    const quotes = quotations
      .filter(q => q.customer.toLowerCase() === name.trim().toLowerCase())
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    if (quotes.length) applyQuotation(quotes[0]);
    else { setNQuotationId(''); }
  };

  const createContract = async () => {
    if (!nCustomer.trim()) return alert('Customer name is required.');
    if (!nItems.some(it => it.description.trim())) return alert('Add at least one line item.');
    setSaving(true);
    try {
      const res = await fetch('/api/contracts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: nCustomer.trim(), phone: nPhone.trim(), email: nEmail.trim(),
          deliveryTo: nDelivery.trim(), deliveryPhone: nDeliveryPhone.trim(), deliveryEmail: nDeliveryEmail.trim(),
          freightType: nFreight,
          commissionRate: Number(nCommission) || 0,
          amountPaid: nPaid,
          quotationId: nQuotationId || undefined,
          items: nItems.filter(it => it.description.trim()).map(it => ({ description: it.description.trim(), qty: Number(it.qty) || 0, price: Number(it.price) || 0 })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create contract');
      setShowNew(false); resetNew();
      await load();
      alert(`Contract ${data.contract.ref} created.`);
    } catch (e: unknown) { alert(`Error: ${e instanceof Error ? e.message : e}`); }
    finally { setSaving(false); }
  };

  const setStatus = async (c: Contract, status: Contract['status']) => {
    try {
      const res = await fetch(`/api/contracts/${c._id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      setContracts(prev => prev.map(x => x._id === c._id ? { ...x, status } : x));
    } catch (e: unknown) { alert(`Error: ${e instanceof Error ? e.message : e}`); }
  };

  const del = async (c: Contract) => {
    if (!confirm(`Delete contract ${c.ref}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/contracts?id=${c._id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setContracts(prev => prev.filter(x => x._id !== c._id));
    } catch (e: unknown) { alert(`Error: ${e instanceof Error ? e.message : e}`); }
  };

  const openSend = (c: Contract) => { setSendContract(c); setSendPhone(c.phone || ''); };
  const doSend = async () => {
    if (!sendContract) return;
    if (!sendPhone.trim()) return alert('Enter a phone number.');
    setSending(true);
    try {
      const res = await fetch(`/api/contracts/${sendContract._id}/send-whatsapp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: sendPhone.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.pdfSent ? 'Agreement PDF sent via WhatsApp!' : 'Sent via WhatsApp (text + PDF link).');
        setContracts(prev => prev.map(x => x._id === sendContract._id ? { ...x, status: 'SENT', phone: sendPhone.trim() } : x));
        setSendContract(null);
      } else {
        alert(`Not delivered: ${data.error || 'Unknown error'}\n\nTip: WhatsApp sending needs the Meta payment method added (error 131042).`);
      }
    } catch (e: unknown) { alert(`Failed: ${e instanceof Error ? e.message : e}`); }
    finally { setSending(false); }
  };

  const addItem = () => setNItems(prev => [...prev, { description: '', qty: 1, price: 0 }]);
  const updItem = (i: number, patch: Partial<ContractItem>) => setNItems(prev => prev.map((it, idx) => idx === i ? { ...it, ...patch } : it));
  const rmItem = (i: number) => setNItems(prev => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev);

  // ── edit contract ──
  const openEdit = async (c: Contract) => {
    setEditC(c);
    setEditLoading(true);
    setECustomer(c.customer); setEPhone(c.phone || ''); setEEmail(c.email || '');
    setEDelivery(c.deliveryTo || ''); setEDeliveryPhone(c.deliveryPhone || ''); setEDeliveryEmail(c.deliveryEmail || '');
    setEFreight(c.freightType); setECommission(String(c.commissionRate));
    setEItems(c.items.length ? c.items.map(it => ({ ...it })) : [{ description: '', qty: 1, price: 0 }]);
    setEAmountPaid(String(c.amountPaid ?? 0));
    setEReceiptNo(c.receiptNo || ''); setEPayMethod(c.paymentMethod || ''); setEPayDate(c.paymentDate || '');
    setEIssuedDate(c.issuedDate);
    setETerms([]); setEDefaultTerms([]);
    try {
      const res = await fetch(`/api/contracts/${c._id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load contract');
      const defaults: TermSection[] = data.defaultTerms || [];
      const stored: TermSection[] = data.contract?.terms?.length ? data.contract.terms : defaults;
      setEDefaultTerms(defaults.map((t: TermSection) => ({ ...t })));
      setETerms(stored.map((t: TermSection) => ({ ...t })));
    } catch (e: unknown) {
      alert(`Error loading terms: ${e instanceof Error ? e.message : e}`);
    } finally { setEditLoading(false); }
  };

  const eSubtotal = eItems.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);
  const eCommAmt = +(eSubtotal * ((Number(eCommission) || 0) / 100)).toFixed(2);
  const eTotal = +(eSubtotal + eCommAmt).toFixed(2);
  const ePaid = Math.min(Math.max(0, Number(eAmountPaid) || 0), eTotal);
  const eBalance = +Math.max(0, eTotal - ePaid).toFixed(2);

  const addEItem = () => setEItems(prev => [...prev, { description: '', qty: 1, price: 0 }]);
  const updEItem = (i: number, patch: Partial<ContractItem>) => setEItems(prev => prev.map((it, idx) => idx === i ? { ...it, ...patch } : it));
  const rmEItem = (i: number) => setEItems(prev => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev);

  const updTerm = (i: number, patch: Partial<TermSection>) => setETerms(prev => prev.map((t, idx) => idx === i ? { ...t, ...patch } : t));
  const rmTerm = (i: number) => setETerms(prev => prev.filter((_, idx) => idx !== i));
  const addTerm = () => setETerms(prev => [...prev, { heading: `${prev.length + 1}. NEW SECTION`, body: '' }]);
  const resetTerms = () => setETerms(eDefaultTerms.map(t => ({ ...t })));

  const saveEdit = async () => {
    if (!editC) return;
    if (!eCustomer.trim()) return alert('Customer name is required.');
    if (!eItems.some(it => it.description.trim())) return alert('Add at least one line item.');
    setESaving(true);
    try {
      // Untouched terms are stored as [] so future figure changes keep flowing into the standard text.
      const termsChanged = JSON.stringify(eTerms) !== JSON.stringify(eDefaultTerms);
      const res = await fetch(`/api/contracts/${editC._id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ edit: {
          customer: eCustomer.trim(), phone: ePhone.trim(), email: eEmail.trim(),
          deliveryTo: eDelivery.trim(), deliveryPhone: eDeliveryPhone.trim(), deliveryEmail: eDeliveryEmail.trim(),
          freightType: eFreight, commissionRate: Number(eCommission) || 0,
          amountPaid: ePaid,
          receiptNo: eReceiptNo.trim(), paymentMethod: ePayMethod.trim(), paymentDate: ePayDate.trim(),
          issuedDate: eIssuedDate,
          items: eItems.filter(it => it.description.trim()).map(it => ({ description: it.description.trim(), qty: Number(it.qty) || 0, price: Number(it.price) || 0 })),
          terms: termsChanged ? eTerms : [],
        } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save contract');
      setEditC(null);
      await load();
      alert(`Contract ${editC.ref} updated — the PDF has been regenerated.`);
    } catch (e: unknown) { alert(`Error: ${e instanceof Error ? e.message : e}`); }
    finally { setESaving(false); }
  };

  const statCards = [
    { label: 'Total Contracts', value: stats.total, icon: FileSignature, color: 'text-slate-200', bg: 'bg-slate-800/40 border-slate-700/40' },
    { label: 'Draft', value: stats.draft, icon: Clock, color: 'text-slate-300', bg: 'bg-slate-800/40 border-slate-700/40' },
    { label: 'Sent', value: stats.sent, icon: Send, color: 'text-amber-400', bg: 'bg-amber-950/20 border-amber-800/20' },
    { label: 'Signed', value: stats.signed, icon: FileCheck, color: 'text-emerald-400', bg: 'bg-emerald-950/20 border-emerald-800/20' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-100 flex items-center gap-3">
            <FileSignature className="text-[#F15D38]" size={28} /> Contracts
          </h1>
          <p className="text-slate-400 font-medium mt-1">Cargo Service Agreements — full history, searchable by customer or phone.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}>
          <Plus size={18} /> New Contract
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(s => (
          <div key={s.label} className={`shipment-card border ${s.bg} py-4`}>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.label}</p>
              <s.icon size={16} className={s.color} />
            </div>
            <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative group flex-1 min-w-[240px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#F15D38] transition-colors" size={20} />
          <input type="text" placeholder="Search by customer name, phone, or ref…" className="search-input !pl-12 w-full" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex gap-1.5">
          {(['ALL', 'DRAFT', 'SENT', 'SIGNED'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-colors ${statusFilter === s ? 'bg-[#F15D38] text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}>
              {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="shipment-card !p-0 overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/40 border-b border-slate-800">
                {['Reference', 'Customer', 'Freight', 'Total', 'Issued', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500"><Loader2 className="animate-spin inline" size={20} /></td></tr>
              )}
              {!loading && filtered.map(c => (
                <tr key={c._id} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4"><span className="font-mono font-bold text-slate-200 text-xs">{c.ref}</span></td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-100 text-sm">{c.customer}</p>
                    {c.phone && <p className="text-[10px] font-bold text-slate-500 font-mono mt-0.5">{c.phone}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300">
                      {c.freightType === 'AIR' ? <Plane size={13} /> : <Ship size={13} />} {c.freightType === 'AIR' ? 'Air' : 'Sea'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-black text-slate-100 text-sm">{money(c.total)}</p>
                    {c.paymentStatus === 'PAID' ? (
                      <p className="text-[10px] font-bold text-emerald-400 mt-0.5">Paid in full</p>
                    ) : (c.balanceDue ?? 0) > 0 && (c.amountPaid ?? 0) > 0 ? (
                      <p className="text-[10px] font-bold text-rose-400 mt-0.5">Bal. {money(c.balanceDue ?? 0)}</p>
                    ) : (c.amountPaid ?? 0) === 0 ? (
                      <p className="text-[10px] font-bold text-slate-500 mt-0.5">Unpaid</p>
                    ) : null}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-400">{fmtDate(c.issuedDate)}</td>
                  <td className="px-6 py-4">
                    <select value={c.status} onChange={e => setStatus(c, e.target.value as Contract['status'])}
                      className={`text-[10px] font-black uppercase tracking-wider rounded-lg border px-2 py-1 cursor-pointer outline-none ${STATUS_STYLES[c.status]}`}>
                      <option value="DRAFT">Draft</option>
                      <option value="SENT">Sent</option>
                      <option value="SIGNED">Signed</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openEdit(c)} title="Edit contract"
                        className="p-2 rounded-lg bg-sky-900/40 hover:bg-sky-800/60 text-sky-300 transition-colors"><Pencil size={15} /></button>
                      {c.pdfUrl && (
                        <a href={c.pdfUrl} target="_blank" rel="noopener noreferrer" title="Download PDF"
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"><Download size={15} /></a>
                      )}
                      <button onClick={() => openSend(c)} title="Send via WhatsApp"
                        className="p-2 rounded-lg bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-300 transition-colors"><Send size={15} /></button>
                      <button onClick={() => del(c)} title="Delete"
                        className="p-2 rounded-lg bg-rose-900/30 hover:bg-rose-800/50 text-rose-400 transition-colors"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-16 text-center">
                  <FileSignature className="mx-auto text-slate-700 mb-3" size={40} />
                  <p className="text-sm font-bold text-slate-500">{contracts.length === 0 ? 'No contracts yet. Create one, or use "Generate Contract" on any quotation.' : 'No contracts match your search.'}</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── New Contract modal ── */}
      {showNew && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-10 px-4 overflow-y-auto" onClick={() => !saving && setShowNew(false)}>
          <div className="w-full max-w-3xl bg-[#131B2E] border border-slate-700 rounded-2xl shadow-2xl mb-10" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <h3 className="text-lg font-black text-slate-100">New Cargo Service Agreement</h3>
              <button onClick={() => setShowNew(false)} className="text-slate-500 hover:text-slate-300"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer *</label>
                  <input list="contract-customers" className="search-input w-full mt-1" placeholder="Customer name" value={nCustomer} onChange={e => onCustomerPick(e.target.value)} />
                  <datalist id="contract-customers">{customers.map(c => <option key={c._id} value={c.name} />)}</datalist>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone</label>
                  <input className="search-input w-full mt-1" placeholder="+252 63…" value={nPhone} onChange={e => setNPhone(e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email / Address</label>
                  <input className="search-input w-full mt-1" placeholder="Optional" value={nEmail} onChange={e => setNEmail(e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Delivery To</label>
                  <input className="search-input w-full mt-1" placeholder="e.g. Inamacalin Fishing Co · Isha Boorame · Hargeisa" value={nDelivery} onChange={e => setNDelivery(e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Delivery Phone</label>
                  <input className="search-input w-full mt-1" placeholder="Optional" value={nDeliveryPhone} onChange={e => setNDeliveryPhone(e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Delivery Email</label>
                  <input className="search-input w-full mt-1" placeholder="Optional" value={nDeliveryEmail} onChange={e => setNDeliveryEmail(e.target.value)} />
                </div>
              </div>

              {/* Load from one of this customer's quotations (goods, prices & payment) */}
              {customerQuotes.length > 0 && (
                <div className="bg-teal-950/20 border border-teal-800/30 rounded-xl px-4 py-3">
                  <label className="text-[10px] font-black text-teal-300 uppercase tracking-widest flex items-center gap-1.5"><FileText size={12} /> Load from quotation ({customerQuotes.length} found)</label>
                  <select
                    className="search-input w-full mt-1.5"
                    value={nQuotationId}
                    onChange={e => {
                      const q = customerQuotes.find(x => x._id === e.target.value);
                      if (q) applyQuotation(q); else setNQuotationId('');
                    }}
                  >
                    <option value="">— Manual entry (no quotation) —</option>
                    {customerQuotes.map(q => (
                      <option key={q._id} value={q._id}>
                        {quoteRef(q._id)} · {fmtDate(q.date)} · {q.type} · {money(q.price)} · {q.paymentStatus === 'PAID' ? 'Paid' : q.paymentStatus === 'PARTIAL' ? `Paid ${money(q.amountPaid)}` : 'Unpaid'}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-teal-300/70 mt-1.5 font-medium">Picks the goods, prices, freight, commission and payment from that quotation. You can still edit below.</p>
                </div>
              )}

              <div className="flex items-center gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Freight Type</label>
                  <div className="flex gap-1.5">
                    {(['SEA', 'AIR'] as const).map(t => (
                      <button key={t} onClick={() => setNFreight(t)}
                        className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 ${nFreight === t ? 'bg-[#F15D38] text-white' : 'bg-slate-800 text-slate-400'}`}>
                        {t === 'AIR' ? <Plane size={13} /> : <Ship size={13} />} {t === 'AIR' ? 'Air' : 'Sea'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Commission %</label>
                  <input type="number" className="search-input w-24" value={nCommission} onChange={e => setNCommission(e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Amount Paid $</label>
                  <input type="number" className="search-input w-28" value={nAmountPaid} onChange={e => setNAmountPaid(e.target.value)} placeholder="0.00" />
                </div>
              </div>

              {/* Line items */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Goods (Schedule A)</label>
                <div className="mt-1.5 space-y-2">
                  {/* column headers */}
                  <div className="grid grid-cols-[1fr_64px_104px_28px] gap-2 px-1">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Description</span>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider text-center">Qty</span>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider text-right">Unit&nbsp;$</span>
                    <span />
                  </div>
                  {nItems.map((it, i) => (
                    <div key={i} className="grid grid-cols-[1fr_64px_104px_28px] gap-2 items-center">
                      <input className="search-input w-full" placeholder="e.g. Commercial Bone Saw Machine" value={it.description} onChange={e => updItem(i, { description: e.target.value })} />
                      <input type="number" className="search-input w-full !px-2 text-center" placeholder="1" value={it.qty} onChange={e => updItem(i, { qty: Number(e.target.value) })} />
                      <input type="number" className="search-input w-full !px-2 text-right" placeholder="0.00" value={it.price} onChange={e => updItem(i, { price: Number(e.target.value) })} />
                      <button onClick={() => rmItem(i)} title="Remove" className="flex items-center justify-center text-slate-500 hover:text-rose-400"><X size={16} /></button>
                    </div>
                  ))}
                </div>
                <button onClick={addItem} className="mt-2.5 text-xs font-bold text-[#F15D38] hover:underline flex items-center gap-1"><Plus size={13} /> Add item</button>
              </div>

              {/* Totals preview */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 space-y-1 text-sm">
                <div className="flex justify-between text-slate-400"><span>Subtotal</span><span className="font-bold text-slate-200">{money(nSubtotal)}</span></div>
                <div className="flex justify-between text-slate-400"><span>Commission ({Number(nCommission) || 0}%)</span><span className="font-bold text-[#F15D38]">{money(nCommAmt)}</span></div>
                <div className="flex justify-between text-slate-100 font-black pt-1 border-t border-slate-800"><span>Estimated Total</span><span>{money(nTotal)}</span></div>
                {nPaid > 0 && (
                  <div className="flex justify-between text-emerald-400 pt-1"><span>Amount Paid</span><span className="font-bold">{money(nPaid)}</span></div>
                )}
                {nPaid > 0 && (
                  <div className={`flex justify-between font-black ${nBalance > 0.01 ? 'text-rose-400' : 'text-emerald-400'}`}><span>{nBalance > 0.01 ? 'Balance Due' : 'Paid in Full'}</span><span>{money(nBalance)}</span></div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-700">
              <button onClick={() => setShowNew(false)} className="btn bg-slate-800 text-slate-300" disabled={saving}>Cancel</button>
              <button onClick={createContract} className="btn btn-primary" disabled={saving}>
                {saving ? <><Loader2 className="animate-spin" size={16} /> Creating…</> : <>Create Contract</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Contract modal ── */}
      {editC && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-10 px-4 overflow-y-auto" onClick={() => !eSaving && setEditC(null)}>
          <div className="w-full max-w-4xl bg-[#131B2E] border border-slate-700 rounded-2xl shadow-2xl mb-10" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <h3 className="text-lg font-black text-slate-100 flex items-center gap-2"><Pencil size={18} className="text-sky-400" /> Edit Contract <span className="font-mono text-sm text-slate-400">{editC.ref}</span></h3>
              <button onClick={() => setEditC(null)} className="text-slate-500 hover:text-slate-300"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-5">
              {/* Customer */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer *</label>
                  <input className="search-input w-full mt-1" value={eCustomer} onChange={e => setECustomer(e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone</label>
                  <input className="search-input w-full mt-1" value={ePhone} onChange={e => setEPhone(e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</label>
                  <input className="search-input w-full mt-1" placeholder="Optional" value={eEmail} onChange={e => setEEmail(e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Issued Date</label>
                  <input type="date" className="search-input w-full mt-1" value={eIssuedDate} onChange={e => setEIssuedDate(e.target.value)} />
                </div>
              </div>

              {/* Delivery address block */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 space-y-3">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Delivery Address</p>
                <input className="search-input w-full" placeholder="e.g. Inamacalin Fishing Co · Isha Boorame · Hargeisa, Somaliland" value={eDelivery} onChange={e => setEDelivery(e.target.value)} />
                <div className="grid grid-cols-2 gap-3">
                  <input className="search-input w-full" placeholder="Delivery phone" value={eDeliveryPhone} onChange={e => setEDeliveryPhone(e.target.value)} />
                  <input className="search-input w-full" placeholder="Delivery email" value={eDeliveryEmail} onChange={e => setEDeliveryEmail(e.target.value)} />
                </div>
              </div>

              {/* Freight / commission / payment */}
              <div className="flex items-end gap-4 flex-wrap">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Freight Type</label>
                  <div className="flex gap-1.5">
                    {(['SEA', 'AIR'] as const).map(t => (
                      <button key={t} onClick={() => setEFreight(t)}
                        className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 ${eFreight === t ? 'bg-[#F15D38] text-white' : 'bg-slate-800 text-slate-400'}`}>
                        {t === 'AIR' ? <Plane size={13} /> : <Ship size={13} />} {t === 'AIR' ? 'Air' : 'Sea'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Commission %</label>
                  <input type="number" className="search-input w-24" value={eCommission} onChange={e => setECommission(e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Amount Paid $</label>
                  <input type="number" className="search-input w-28" value={eAmountPaid} onChange={e => setEAmountPaid(e.target.value)} />
                </div>
              </div>

              {/* Payment receipt (shown on the agreement, e.g. "Receipt INV-32133196 · EDAHAB · 13 Jul 2026") */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Receipt No.</label>
                  <input className="search-input w-full mt-1" placeholder="e.g. INV-32133196" value={eReceiptNo} onChange={e => setEReceiptNo(e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Method</label>
                  <input className="search-input w-full mt-1" placeholder="e.g. eDahab / Zaad / Bank" value={ePayMethod} onChange={e => setEPayMethod(e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Date</label>
                  <input type="date" className="search-input w-full mt-1" value={ePayDate} onChange={e => setEPayDate(e.target.value)} />
                </div>
              </div>

              {/* Line items */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Goods (Schedule A)</label>
                <div className="mt-1.5 space-y-2">
                  <div className="grid grid-cols-[1fr_64px_104px_28px] gap-2 px-1">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Description</span>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider text-center">Qty</span>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider text-right">Unit&nbsp;$</span>
                    <span />
                  </div>
                  {eItems.map((it, i) => (
                    <div key={i} className="grid grid-cols-[1fr_64px_104px_28px] gap-2 items-center">
                      <input className="search-input w-full" value={it.description} onChange={e => updEItem(i, { description: e.target.value })} />
                      <input type="number" className="search-input w-full !px-2 text-center" value={it.qty} onChange={e => updEItem(i, { qty: Number(e.target.value) })} />
                      <input type="number" className="search-input w-full !px-2 text-right" value={it.price} onChange={e => updEItem(i, { price: Number(e.target.value) })} />
                      <button onClick={() => rmEItem(i)} title="Remove" className="flex items-center justify-center text-slate-500 hover:text-rose-400"><X size={16} /></button>
                    </div>
                  ))}
                </div>
                <button onClick={addEItem} className="mt-2.5 text-xs font-bold text-[#F15D38] hover:underline flex items-center gap-1"><Plus size={13} /> Add item</button>
              </div>

              {/* Totals preview */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 space-y-1 text-sm">
                <div className="flex justify-between text-slate-400"><span>Subtotal</span><span className="font-bold text-slate-200">{money(eSubtotal)}</span></div>
                <div className="flex justify-between text-slate-400"><span>Commission ({Number(eCommission) || 0}%)</span><span className="font-bold text-[#F15D38]">{money(eCommAmt)}</span></div>
                <div className="flex justify-between text-slate-100 font-black pt-1 border-t border-slate-800"><span>Estimated Total</span><span>{money(eTotal)}</span></div>
                {ePaid > 0 && (
                  <div className="flex justify-between text-emerald-400 pt-1"><span>Amount Paid</span><span className="font-bold">{money(ePaid)}</span></div>
                )}
                {ePaid > 0 && (
                  <div className={`flex justify-between font-black ${eBalance > 0.01 ? 'text-rose-400' : 'text-emerald-400'}`}><span>{eBalance > 0.01 ? 'Balance Due' : 'Paid in Full'}</span><span>{money(eBalance)}</span></div>
                )}
              </div>

              {/* Terms & Conditions editor */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Terms &amp; Conditions — edit any section</label>
                  <button onClick={resetTerms} className="text-[11px] font-bold text-slate-400 hover:text-slate-200 flex items-center gap-1" title="Restore the standard Q Cargo terms">
                    <RotateCcw size={12} /> Reset to standard
                  </button>
                </div>
                {editLoading ? (
                  <div className="text-center py-8 text-slate-500"><Loader2 className="animate-spin inline" size={18} /> Loading terms…</div>
                ) : (
                  <div className="mt-2 space-y-3 max-h-[420px] overflow-y-auto pr-1">
                    {eTerms.map((t, i) => (
                      <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <input className="search-input flex-1 !py-1.5 font-bold" value={t.heading} onChange={e => updTerm(i, { heading: e.target.value })} />
                          <button onClick={() => rmTerm(i)} title="Remove section" className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30"><Trash2 size={14} /></button>
                        </div>
                        <textarea
                          className="search-input w-full !h-auto text-[13px] leading-relaxed font-normal"
                          rows={Math.min(10, Math.max(2, t.body.split('\n').length))}
                          value={t.body}
                          onChange={e => updTerm(i, { body: e.target.value })}
                        />
                      </div>
                    ))}
                    <button onClick={addTerm} className="text-xs font-bold text-[#F15D38] hover:underline flex items-center gap-1"><Plus size={13} /> Add section</button>
                    <p className="text-[10px] text-slate-500 font-medium">Lines starting with &quot;- &quot; become bullet points on the PDF.</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-700">
              <button onClick={() => setEditC(null)} className="btn bg-slate-800 text-slate-300" disabled={eSaving}>Cancel</button>
              <button onClick={saveEdit} className="btn btn-primary" disabled={eSaving || editLoading}>
                {eSaving ? <><Loader2 className="animate-spin" size={16} /> Saving &amp; regenerating PDF…</> : <>Save &amp; Regenerate PDF</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Send modal ── */}
      {sendContract && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center px-4" onClick={() => !sending && setSendContract(null)}>
          <div className="w-full max-w-md bg-[#131B2E] border border-slate-700 rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <h3 className="text-lg font-black text-slate-100">Send agreement via WhatsApp</h3>
              <button onClick={() => setSendContract(null)} className="text-slate-500 hover:text-slate-300"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-sm text-slate-400">Send <span className="font-bold text-slate-200">{sendContract.ref}</span> to <span className="font-bold text-slate-200">{sendContract.customer}</span>.</p>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone number</label>
                <input className="search-input w-full mt-1" value={sendPhone} onChange={e => setSendPhone(e.target.value)} placeholder="+252 63…" />
              </div>
              <div className="flex items-start gap-2 text-[11px] font-medium text-amber-300/80 bg-amber-950/20 border border-amber-800/30 rounded-lg px-3 py-2">
                <Clock size={14} className="shrink-0 mt-0.5" />
                WhatsApp delivery needs the Meta payment method added (currently error 131042). The PDF is always available via Download.
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-700">
              <button onClick={() => setSendContract(null)} className="btn bg-slate-800 text-slate-300" disabled={sending}>Cancel</button>
              <button onClick={doSend} className="btn btn-primary" disabled={sending}>
                {sending ? <><Loader2 className="animate-spin" size={16} /> Sending…</> : <><Send size={16} /> Send</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
