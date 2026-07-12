'use client';

import { useState, useEffect, useCallback, useMemo, use } from 'react';
import {
  ArrowLeft, Save, Building2, MapPin, Phone, MessageCircle, ExternalLink, User,
  Check, X, Copy, Loader2, Upload, Trash2, FileText, Image as ImageIcon,
  ShieldCheck, ShieldQuestion, Send, BadgeCheck, ClipboardList, Factory, Link2,
} from 'lucide-react';
import Link from 'next/link';

const DOC_TYPES = [
  'Business License',
  'Manufacturing License',
  'Export License',
  'CE Certificate',
  'ISO Certificate',
  'CCC Certificate',
  'SGS Certificate',
  'Other Certification',
  'Company Profile',
  'Catalog',
  'Factory Photo',
  'Other',
];

const CERT_TYPES = ['CE Certificate', 'ISO Certificate', 'CCC Certificate', 'SGS Certificate', 'Other Certification'];

interface SupplierDoc {
  _id?: string;
  type: string;
  url: string;
  name: string;
  expiry?: string;
  note?: string;
  uploadedAt?: string;
}

interface Supplier {
  _id: string;
  name: string; location: string; products: string; wechat: string; phone: string;
  whatsapp: string; storeLink: string; contactPerson: string; notes: string;
  factoryAddress: string; officeAddress: string; registrationYear: string;
  employees: string; factorySizeSqm: string;
  productionCapacity: string; qcProcess: string; warrantyPolicy: string; exportMarkets: string;
  website: string; socialMedia: string; videoLinks: string;
  documents: SupplierDoc[];
  verificationStatus: 'NOT_VERIFIED' | 'DOCS_REQUESTED' | 'VERIFIED';
  docsRequestedAt?: string; verifiedAt?: string;
}

// The 16-question supplier verification message (WhatsApp/WeChat formatting).
const requestMessage = (name: string) => `*Dear ${name || 'Supplier'},*

As we are looking to build a long-term business partnership, we would like to learn more about your company for our supplier verification process.

*Could you please provide the following information?*

1. Company profile or introduction.
2. Business license.
3. Manufacturing license (if applicable).
4. Factory address and office address.
5. Company registration year.
6. Number of employees.
7. Factory size (square meters).
8. Main products you manufacture or supply.
9. Export licenses (if applicable).
10. Product certifications (such as CE, ISO, CCC, SGS, or other certifications you have).
11. Photos and videos of your factory, products, and showroom.
12. Your main export markets and countries.
13. Your production capacity (monthly or yearly).
14. Your quality control process.
15. Warranty and after-sales service policy.
16. Company website, catalog, and social media accounts (if available).

This information will help us complete our supplier evaluation and establish a long-term partnership based on trust and transparency.

Thank you for your cooperation. We look forward to working with you for many years.

*Q Cargo Logistics*`;

// Which of the 16 items are answered, derived from fields + uploaded documents.
function buildChecklist(s: Supplier) {
  const hasDoc = (...types: string[]) => (s.documents || []).some(d => types.includes(d.type));
  const has = (v?: string) => !!(v && v.trim());
  return [
    { n: 1, label: 'Company profile / introduction', done: hasDoc('Company Profile') },
    { n: 2, label: 'Business license', done: hasDoc('Business License') },
    { n: 3, label: 'Manufacturing license', done: hasDoc('Manufacturing License'), optional: true },
    { n: 4, label: 'Factory & office address', done: has(s.factoryAddress) || has(s.officeAddress) },
    { n: 5, label: 'Registration year', done: has(s.registrationYear) },
    { n: 6, label: 'Number of employees', done: has(s.employees) },
    { n: 7, label: 'Factory size (m²)', done: has(s.factorySizeSqm) },
    { n: 8, label: 'Main products', done: has(s.products) },
    { n: 9, label: 'Export licenses', done: hasDoc('Export License'), optional: true },
    { n: 10, label: 'Certifications (CE / ISO / CCC / SGS)', done: hasDoc(...CERT_TYPES) },
    { n: 11, label: 'Factory photos & videos', done: hasDoc('Factory Photo') || has(s.videoLinks) },
    { n: 12, label: 'Main export markets', done: has(s.exportMarkets) },
    { n: 13, label: 'Production capacity', done: has(s.productionCapacity) },
    { n: 14, label: 'Quality control process', done: has(s.qcProcess) },
    { n: 15, label: 'Warranty & after-sales policy', done: has(s.warrantyPolicy) },
    { n: 16, label: 'Website / catalog / social media', done: has(s.website) || has(s.socialMedia) || hasDoc('Catalog') },
  ];
}

const VERIFY_BADGE: Record<string, { label: string; cls: string }> = {
  NOT_VERIFIED: { label: 'Not Verified', cls: 'bg-slate-800 text-slate-400 border-slate-700' },
  DOCS_REQUESTED: { label: 'Docs Requested', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  VERIFIED: { label: 'Verified', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
};

export default function SupplierDetail({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = params && 'then' in params ? use(params) : params;
  const id = resolvedParams?.id;

  const [loading, setLoading] = useState(true);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [form, setForm] = useState<Partial<Supplier>>({});
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [copied, setCopied] = useState(false);

  // Document upload form
  const [docType, setDocType] = useState('Business License');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docExpiry, setDocExpiry] = useState('');
  const [docNote, setDocNote] = useState('');
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/suppliers?id=${id}`);
      if (res.ok) {
        const data = await res.json();
        setSupplier(data);
        setForm(data);
      }
    } finally { setLoading(false); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const patch = async (body: Partial<Supplier>) => {
    const res = await fetch(`/api/suppliers?id=${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (res.ok) {
      const updated = await res.json();
      setSupplier(updated);
      setForm(updated);
      return true;
    }
    const d = await res.json().catch(() => ({}));
    alert(d.error || 'Failed to save');
    return false;
  };

  const saveFields = async () => {
    setSaving(true);
    try {
      const ok = await patch({
        name: form.name, location: form.location, products: form.products,
        wechat: form.wechat, phone: form.phone, whatsapp: form.whatsapp,
        storeLink: form.storeLink, contactPerson: form.contactPerson, notes: form.notes,
        factoryAddress: form.factoryAddress, officeAddress: form.officeAddress,
        registrationYear: form.registrationYear, employees: form.employees, factorySizeSqm: form.factorySizeSqm,
        productionCapacity: form.productionCapacity, qcProcess: form.qcProcess,
        warrantyPolicy: form.warrantyPolicy, exportMarkets: form.exportMarkets,
        website: form.website, socialMedia: form.socialMedia, videoLinks: form.videoLinks,
      });
      if (ok) { setSavedFlash(true); setTimeout(() => setSavedFlash(false), 2000); }
    } finally { setSaving(false); }
  };

  const copyRequest = async () => {
    if (!supplier) return;
    await navigator.clipboard.writeText(requestMessage(supplier.name));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (supplier.verificationStatus === 'NOT_VERIFIED') {
      await patch({ verificationStatus: 'DOCS_REQUESTED', docsRequestedAt: new Date().toISOString() } as Partial<Supplier>);
    }
  };

  const setStatus = async (status: Supplier['verificationStatus']) => {
    const body: Record<string, unknown> = { verificationStatus: status };
    if (status === 'VERIFIED') body.verifiedAt = new Date().toISOString();
    await patch(body as Partial<Supplier>);
  };

  const uploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFile || !supplier) return alert('Choose a file first');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', docFile);
      const res = await fetch('/api/suppliers/upload', { method: 'POST', body: fd });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Upload failed');
      const newDoc: SupplierDoc = {
        type: docType, url: d.url, name: d.name || docFile.name,
        expiry: docExpiry, note: docNote, uploadedAt: new Date().toISOString(),
      };
      await patch({ documents: [...(supplier.documents || []), newDoc] });
      setDocFile(null); setDocExpiry(''); setDocNote('');
      (document.getElementById('doc-file-input') as HTMLInputElement | null)?.form?.reset?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed');
    } finally { setUploading(false); }
  };

  const removeDoc = async (doc: SupplierDoc) => {
    if (!supplier) return;
    if (!confirm(`Delete "${doc.name || doc.type}"?`)) return;
    await patch({ documents: (supplier.documents || []).filter(d => d !== doc && d._id !== doc._id) });
  };

  const checklist = useMemo(() => (supplier ? buildChecklist(supplier) : []), [supplier]);
  const doneCount = checklist.filter(c => c.done).length;

  const field = 'w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#F15D38]';
  const lbl = 'block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5';
  const cardCls = 'bg-[#131B2E] border border-slate-800 rounded-2xl p-6';
  const sectionTitle = 'text-sm font-black text-slate-100 uppercase tracking-widest flex items-center gap-2 mb-4';

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 size={28} className="animate-spin text-[#F15D38]" /></div>;
  if (!supplier) return (
    <div className="text-center py-32 text-slate-500">
      <Building2 size={40} className="mx-auto mb-4 opacity-30" />
      <p className="font-bold">Supplier not found.</p>
      <Link href="/admin/purchases?tab=suppliers" className="text-[#F15D38] text-sm font-bold mt-2 inline-block">← Back to Suppliers</Link>
    </div>
  );

  const badge = VERIFY_BADGE[supplier.verificationStatus] || VERIFY_BADGE.NOT_VERIFIED;
  const photos = (supplier.documents || []).filter(d => d.type === 'Factory Photo');
  const files = (supplier.documents || []).filter(d => d.type !== 'Factory Photo');

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-in fade-in duration-300 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/admin/purchases?tab=suppliers" className="p-2 rounded-xl bg-[#131B2E] border border-slate-800 text-slate-400 hover:text-slate-100 shrink-0"><ArrowLeft size={18} /></Link>
          <div className="w-11 h-11 rounded-xl bg-[#F15D38]/10 border border-[#F15D38]/20 flex items-center justify-center text-[#F15D38] shrink-0"><Building2 size={20} /></div>
          <div className="min-w-0">
            <h1 className="text-xl font-black text-slate-100 truncate">{supplier.name}</h1>
            <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500">
              {supplier.location && <span className="flex items-center gap-1"><MapPin size={10} />{supplier.location}</span>}
              {supplier.contactPerson && <span className="flex items-center gap-1"><User size={10} />{supplier.contactPerson}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-3 py-1.5 rounded-full text-[11px] font-black border ${badge.cls}`}>{badge.label}</span>
          {supplier.verificationStatus !== 'VERIFIED' ? (
            <button onClick={() => setStatus('VERIFIED')} className="btn bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5 text-xs px-4"><BadgeCheck size={14} /> Mark Verified</button>
          ) : (
            <button onClick={() => setStatus('NOT_VERIFIED')} className="btn bg-[#131B2E] border border-slate-800 text-slate-400 flex items-center gap-1.5 text-xs px-4"><ShieldQuestion size={14} /> Un-verify</button>
          )}
          <button onClick={copyRequest} className="btn btn-primary flex items-center gap-1.5 text-xs px-4">
            {copied ? <Check size={14} /> : <Send size={14} />} {copied ? 'Copied!' : 'Request Documents'}
          </button>
        </div>
      </div>

      {/* Contact strip */}
      <div className={`${cardCls} !py-4 flex flex-wrap items-center gap-x-5 gap-y-2`}>
        {supplier.wechat && <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400"><MessageCircle size={13} /> WeChat: {supplier.wechat}</span>}
        {supplier.phone && <a href={`tel:${supplier.phone}`} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white"><Phone size={13} />{supplier.phone}</a>}
        {supplier.whatsapp && <a href={`https://wa.me/${supplier.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300"><MessageCircle size={13} />WhatsApp</a>}
        {supplier.storeLink && <a href={supplier.storeLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:text-sky-300"><ExternalLink size={13} />Store</a>}
        {supplier.website && <a href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:text-sky-300"><Link2 size={13} />Website</a>}
        {supplier.products && <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400">Sells: {supplier.products}</span>}
      </div>

      {/* Verification checklist */}
      <div className={cardCls}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`${sectionTitle} !mb-0`}><ClipboardList size={15} className="text-[#F15D38]" /> Verification Checklist</h2>
          <span className="text-xs font-black text-slate-300">{doneCount} <span className="text-slate-500">/ {checklist.length} received</span></span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-gradient-to-r from-[#0d9488] to-[#F15D38] rounded-full transition-all" style={{ width: `${(doneCount / checklist.length) * 100}%` }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
          {checklist.map(item => (
            <div key={item.n} className="flex items-center gap-2 text-xs font-bold">
              {item.done
                ? <span className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0"><Check size={12} /></span>
                : <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-600 flex items-center justify-center shrink-0"><X size={12} /></span>}
              <span className={item.done ? 'text-slate-200' : 'text-slate-500'}>
                {item.n}. {item.label}{item.optional && <span className="text-slate-600"> (if applicable)</span>}
              </span>
            </div>
          ))}
        </div>
        {supplier.docsRequestedAt && supplier.verificationStatus === 'DOCS_REQUESTED' && (
          <p className="text-[11px] text-amber-400/80 font-bold mt-3">Documents requested on {new Date(supplier.docsRequestedAt).toLocaleDateString()}</p>
        )}
        {supplier.verifiedAt && supplier.verificationStatus === 'VERIFIED' && (
          <p className="text-[11px] text-emerald-400/80 font-bold mt-3 flex items-center gap-1"><ShieldCheck size={12} /> Verified on {new Date(supplier.verifiedAt).toLocaleDateString()}</p>
        )}
      </div>

      {/* Documents */}
      <div className={cardCls}>
        <h2 className={sectionTitle}><FileText size={15} className="text-[#F15D38]" /> Documents & Certificates</h2>

        <form onSubmit={uploadDoc} className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-5 items-end">
          <div className="md:col-span-3">
            <label className={lbl}>Document type</label>
            <select className={field} value={docType} onChange={e => setDocType(e.target.value)}>
              {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="md:col-span-4">
            <label className={lbl}>File (PDF / image)</label>
            <input id="doc-file-input" type="file" accept=".pdf,image/*" onChange={e => setDocFile(e.target.files?.[0] || null)}
              className="w-full text-xs font-bold text-slate-400 file:mr-3 file:btn file:btn-primary file:border-0 file:text-xs file:px-4 file:py-2 file:rounded-xl file:cursor-pointer" />
          </div>
          <div className="md:col-span-2">
            <label className={lbl}>Expiry (optional)</label>
            <input type="date" className={field} value={docExpiry} onChange={e => setDocExpiry(e.target.value)} />
          </div>
          <div className="md:col-span-3">
            <button type="submit" disabled={uploading || !docFile} className="btn btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40">
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Upload
            </button>
          </div>
        </form>

        {files.length === 0 && photos.length === 0 ? (
          <p className="text-xs text-slate-500 font-bold text-center py-6">No documents uploaded yet. Use the form above — business license, CE certificate, catalog…</p>
        ) : (
          <div className="space-y-2">
            {files.map((d, i) => {
              const expired = d.expiry && d.expiry < new Date().toISOString().split('T')[0];
              return (
                <div key={d._id || i} className="flex items-center gap-3 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5">
                  <FileText size={16} className="text-[#0d9488] shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-slate-200 truncate">{d.type}</p>
                    <p className="text-[10px] font-bold text-slate-500 truncate">{d.name}{d.note ? ` — ${d.note}` : ''}</p>
                  </div>
                  {d.expiry && <span className={`text-[10px] font-black shrink-0 ${expired ? 'text-rose-400' : 'text-slate-500'}`}>{expired ? 'EXPIRED ' : 'Exp. '}{d.expiry}</span>}
                  <a href={d.url} target="_blank" rel="noreferrer" className="p-1.5 text-sky-400 hover:text-sky-300 shrink-0" title="View / download"><ExternalLink size={14} /></a>
                  <button onClick={() => removeDoc(d)} className="p-1.5 text-slate-500 hover:text-rose-400 shrink-0" title="Delete"><Trash2 size={14} /></button>
                </div>
              );
            })}
          </div>
        )}

        {photos.length > 0 && (
          <div className="mt-5">
            <p className={lbl}><ImageIcon size={11} className="inline mr-1" />Factory photos</p>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              {photos.map((d, i) => (
                <div key={d._id || i} className="relative group">
                  <a href={d.url} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={d.url} alt={d.note || 'Factory photo'} className="w-full h-24 object-cover rounded-xl border border-slate-800" />
                  </a>
                  <button onClick={() => removeDoc(d)} className="absolute top-1 right-1 p-1 rounded-lg bg-slate-950/70 text-slate-400 hover:text-rose-400 opacity-0 group-hover:opacity-100"><Trash2 size={12} /></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Factory facts */}
      <div className={cardCls}>
        <h2 className={sectionTitle}><Factory size={15} className="text-[#F15D38]" /> Factory Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={lbl}>Factory address</label><input className={field} value={form.factoryAddress || ''} onChange={e => setForm({ ...form, factoryAddress: e.target.value })} placeholder="Factory address in China" /></div>
          <div><label className={lbl}>Office address</label><input className={field} value={form.officeAddress || ''} onChange={e => setForm({ ...form, officeAddress: e.target.value })} placeholder="Office / showroom address" /></div>
          <div className="grid grid-cols-3 gap-3 md:col-span-2">
            <div><label className={lbl}>Registered year</label><input className={field} value={form.registrationYear || ''} onChange={e => setForm({ ...form, registrationYear: e.target.value })} placeholder="e.g. 2012" /></div>
            <div><label className={lbl}>Employees</label><input className={field} value={form.employees || ''} onChange={e => setForm({ ...form, employees: e.target.value })} placeholder="e.g. 150" /></div>
            <div><label className={lbl}>Factory size (m²)</label><input className={field} value={form.factorySizeSqm || ''} onChange={e => setForm({ ...form, factorySizeSqm: e.target.value })} placeholder="e.g. 5000" /></div>
          </div>
        </div>
      </div>

      {/* Capability */}
      <div className={cardCls}>
        <h2 className={sectionTitle}><ShieldCheck size={15} className="text-[#F15D38]" /> Capability & Quality</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={lbl}>Production capacity (monthly / yearly)</label><textarea rows={2} className={`${field} resize-none`} value={form.productionCapacity || ''} onChange={e => setForm({ ...form, productionCapacity: e.target.value })} placeholder="e.g. 50,000 units per month" /></div>
          <div><label className={lbl}>Quality control process</label><textarea rows={2} className={`${field} resize-none`} value={form.qcProcess || ''} onChange={e => setForm({ ...form, qcProcess: e.target.value })} placeholder="Incoming / in-line / final QC…" /></div>
          <div><label className={lbl}>Warranty & after-sales policy</label><textarea rows={2} className={`${field} resize-none`} value={form.warrantyPolicy || ''} onChange={e => setForm({ ...form, warrantyPolicy: e.target.value })} placeholder="e.g. 1-year warranty, free replacement parts" /></div>
          <div><label className={lbl}>Main export markets & countries</label><textarea rows={2} className={`${field} resize-none`} value={form.exportMarkets || ''} onChange={e => setForm({ ...form, exportMarkets: e.target.value })} placeholder="e.g. Middle East, East Africa, Europe" /></div>
        </div>
      </div>

      {/* Links & media */}
      <div className={cardCls}>
        <h2 className={sectionTitle}><Link2 size={15} className="text-[#F15D38]" /> Website, Social & Videos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={lbl}>Company website</label><input className={field} value={form.website || ''} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="https://…" /></div>
          <div><label className={lbl}>Social media accounts</label><input className={field} value={form.socialMedia || ''} onChange={e => setForm({ ...form, socialMedia: e.target.value })} placeholder="Facebook / Instagram / TikTok…" /></div>
          <div className="md:col-span-2"><label className={lbl}>Factory video links (one per line)</label><textarea rows={2} className={`${field} resize-none`} value={form.videoLinks || ''} onChange={e => setForm({ ...form, videoLinks: e.target.value })} placeholder="YouTube / WeChat video links…" /></div>
        </div>
        {(form.videoLinks || '').split('\n').map(v => v.trim()).filter(v => v.startsWith('http')).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {(form.videoLinks || '').split('\n').map(v => v.trim()).filter(v => v.startsWith('http')).map((v, i) => (
              <a key={i} href={v} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-400 hover:text-sky-300 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5"><ExternalLink size={11} /> Video {i + 1}</a>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      <div className={cardCls}>
        <h2 className={sectionTitle}><FileText size={15} className="text-[#F15D38]" /> Notes</h2>
        <textarea rows={3} className={`${field} resize-none`} value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Quality, prices, terms, negotiation history…" />
      </div>

      {/* Save bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0B0F19]/90 backdrop-blur border-t border-slate-800 py-3 px-4 z-40">
        <div className="max-w-5xl mx-auto flex justify-end">
          <button onClick={saveFields} disabled={saving} className="btn btn-primary flex items-center gap-2 px-8">
            {saving ? <Loader2 size={14} className="animate-spin" /> : savedFlash ? <Check size={14} /> : <Save size={14} />}
            {savedFlash ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
