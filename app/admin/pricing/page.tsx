'use client';

import { useState, useEffect } from 'react';
import { Plus, Users, Target, Loader2, Trash2, X, ImagePlus, Globe, Clock, CheckCircle2, Pencil } from 'lucide-react';
import Link from 'next/link';

const STATUS_COLOR: Record<string, string> = {
  OPEN:        'bg-amber-950/30 text-amber-400 border-amber-800/30',
  IN_PROGRESS: 'bg-blue-950/30 text-blue-400 border-blue-800/30',
  COMPLETED:   'bg-emerald-950/30 text-emerald-400 border-emerald-800/30',
  CANCELLED:   'bg-slate-900 text-slate-500 border-slate-800',
};

const LANG_LABEL: Record<string, string> = { en: 'English', ar: 'Arabic', zh: 'Chinese' };

export default function AdminPricingPage() {
  const [tab, setTab] = useState<'requests' | 'agents'>('requests');

  // Requests
  const [requests, setRequests] = useState<any[]>([]);
  const [reqLoading, setReqLoading] = useState(true);
  const [showNewReq, setShowNewReq] = useState(false);

  // Agents
  const [agents, setAgents] = useState<any[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [showNewAgent, setShowNewAgent] = useState(false);
  const [editingAgent, setEditingAgent] = useState<any>(null);
  const [showEditAgent, setShowEditAgent] = useState(false);

  // Edit agent form
  const [eaName, setEaName]     = useState('');
  const [eaCity, setEaCity]     = useState('');
  const [eaCountry, setEaCountry] = useState('');
  const [eaCountryCustom, setEaCountryCustom] = useState('');
  const [eaPhone, setEaPhone]   = useState('');
  const [eaUser, setEaUser]     = useState('');
  const [eaPass, setEaPass]     = useState('');
  const [eaLang, setEaLang]     = useState('en');
  const [eaSaving, setEaSaving] = useState(false);

  // New request form
  const [rCustomer, setRCustomer]   = useState('');
  const [rProduct, setRProduct]     = useState('');
  const [rDesc, setRDesc]           = useState('');
  const [rQty, setRQty]             = useState('1');
  const [rUnit, setRUnit]           = useState('pcs');
  const [rBudget, setRBudget]       = useState('');
  const [rDeadline, setRDeadline]   = useState('');
  const [rAgents, setRAgents]       = useState<string[]>([]);
  const [rNotes, setRNotes]         = useState('');
  const [rPhotos, setRPhotos]       = useState<string[]>([]);
  const [rUploading, setRUploading] = useState(false);
  const [rSaving, setRSaving]       = useState(false);

  // New agent form
  const [aName, setAName]       = useState('');
  const [aCity, setACity]       = useState('');
  const [aCountry, setACountry] = useState('China');
  const [aCountryCustom, setACountryCustom] = useState('');
  const [aUser, setAUser]       = useState('');
  const [aPass, setAPass]       = useState('');
  const [aLang, setALang]       = useState('en');
  const [aPhone, setAPhone]     = useState('');
  const [aSaving, setASaving]   = useState(false);

  useEffect(() => {
    fetch('/api/pricing/requests').then(r => r.json()).then(d => { if (Array.isArray(d)) setRequests(d); }).finally(() => setReqLoading(false));
  }, []);

  useEffect(() => {
    if (tab !== 'agents') return;
    setAgentsLoading(true);
    fetch('/api/agents').then(r => r.json()).then(d => { if (Array.isArray(d)) setAgents(d); }).finally(() => setAgentsLoading(false));
    // Poll every 30s to refresh online status
    const interval = setInterval(() => {
      fetch('/api/agents').then(r => r.json()).then(d => { if (Array.isArray(d)) setAgents(d); });
    }, 30000);
    return () => clearInterval(interval);
  }, [tab]);

  const openEditAgent = (a: any) => {
    const KNOWN = ['China','UAE','Hong Kong','Turkey','India','Somalia','Ethiopia','Kenya'];
    setEditingAgent(a);
    setEaName(a.name || ''); setEaCity(a.city || '');
    setEaPhone(a.phone || ''); setEaUser(a.username || '');
    setEaPass(''); setEaLang(a.language || 'en');
    if (KNOWN.includes(a.country)) { setEaCountry(a.country); setEaCountryCustom(''); }
    else { setEaCountry('Other'); setEaCountryCustom(a.country || ''); }
    setShowEditAgent(true);
  };

  const handleSaveEditAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAgent) return;
    setEaSaving(true);
    const finalCountry = eaCountry === 'Other' ? eaCountryCustom || 'Other' : eaCountry;
    const body: any = { id: editingAgent._id, name: eaName, city: eaCity, country: finalCountry, language: eaLang, phone: eaPhone, username: eaUser };
    if (eaPass) body.password = eaPass;
    try {
      const res = await fetch('/api/agents', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const updated = await res.json();
      setAgents(prev => prev.map(a => a._id === editingAgent._id ? { ...a, ...updated } : a));
      setShowEditAgent(false);
    } finally { setEaSaving(false); }
  };

  const handleToggleAgent = async (a: any) => {
    const res = await fetch('/api/agents', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: a._id, active: !a.active }) });
    const updated = await res.json();
    setAgents(prev => prev.map(x => x._id === a._id ? { ...x, active: updated.active } : x));
  };

  const isOnline = (lastSeen?: string) => {
    if (!lastSeen) return false;
    return new Date(lastSeen) > new Date(Date.now() - 2 * 60 * 1000);
  };

  const lastSeenText = (lastSeen?: string) => {
    if (!lastSeen) return 'Never';
    const diff = Date.now() - new Date(lastSeen).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const uploadPhoto = async (file: File) => {
    setRUploading(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await fetch('/api/pricing/upload', { method: 'POST', body: fd });
      const { url } = await res.json();
      if (url) setRPhotos(prev => [...prev, url]);
    } finally { setRUploading(false); }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setRSaving(true);
    try {
      const res = await fetch('/api/pricing/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName: rCustomer, productName: rProduct, description: rDesc, quantity: parseFloat(rQty), unit: rUnit, targetPrice: rBudget ? parseFloat(rBudget) : undefined, deadline: rDeadline, assignedAgents: rAgents, notes: rNotes, photos: rPhotos }),
      });
      const saved = await res.json();
      setRequests(prev => [saved, ...prev]);
      setShowNewReq(false);
      setRCustomer(''); setRProduct(''); setRDesc(''); setRQty('1'); setRUnit('pcs'); setRBudget(''); setRDeadline(''); setRAgents([]); setRNotes(''); setRPhotos([]);
    } finally { setRSaving(false); }
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setASaving(true);
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: aName, city: aCity, country: aCountry === 'Other' ? aCountryCustom || 'Other' : aCountry, username: aUser, password: aPass, language: aLang, phone: aPhone }),
      });
      if (!res.ok) { const e = await res.json(); alert(e.error); return; }
      const saved = await res.json();
      setAgents(prev => [saved, ...prev]);
      setShowNewAgent(false);
      setAName(''); setACity(''); setAUser(''); setAPass(''); setAPhone('');
    } finally { setASaving(false); }
  };

  const handleDeleteAgent = async (id: string, name: string) => {
    if (!confirm(`Delete agent ${name}?`)) return;
    await fetch('/api/agents', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setAgents(prev => prev.filter(a => a._id !== id));
  };

  const handleDeleteRequest = async (id: string) => {
    if (!confirm('Delete this pricing request?')) return;
    await fetch(`/api/pricing/requests/${id}`, { method: 'DELETE' });
    setRequests(prev => prev.filter(r => r._id !== id));
  };

  const open = requests.filter(r => r.status === 'OPEN').length;
  const inProg = requests.filter(r => r.status === 'IN_PROGRESS').length;
  const done = requests.filter(r => r.status === 'COMPLETED').length;

  return (
    <div className="admin-container pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight">Sourcing & Pricing</h1>
          <p className="text-slate-400 font-medium">Send pricing requests to your global agents and compare responses</p>
        </div>
        <button onClick={() => setShowNewReq(true)} className="btn btn-primary flex items-center gap-2 shadow-lg shadow-[#F15D38]/20">
          <Plus size={16} /> New Request
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Open', value: open, icon: Target, color: 'text-amber-400', bg: 'bg-amber-950/20 border-amber-800/20' },
          { label: 'In Progress', value: inProg, icon: Clock, color: 'text-blue-400', bg: 'bg-blue-950/20 border-blue-800/20' },
          { label: 'Completed', value: done, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-950/20 border-emerald-800/20' },
          { label: 'Active Agents', value: agents.length || '—', icon: Users, color: 'text-[#F15D38]', bg: 'bg-[#F15D38]/10 border-[#F15D38]/20' },
        ].map(s => (
          <div key={s.label} className={`shipment-card border ${s.bg} py-5`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
              <s.icon size={16} className={s.color} />
            </div>
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-900 border border-slate-800 rounded-[1.5rem] mb-8">
        {(['requests', 'agents'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === t ? 'bg-[#F15D38] text-white' : 'text-slate-400 hover:text-slate-200'}`}>
            {t === 'requests' ? <><Target size={13} /> Requests</> : <><Users size={13} /> Agents</>}
          </button>
        ))}
      </div>

      {/* ── REQUESTS TAB ── */}
      {tab === 'requests' && (
        <div className="space-y-3">
          {reqLoading ? (
            <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-[#F15D38]" /></div>
          ) : requests.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Target size={40} className="mx-auto mb-4 opacity-30" />
              <p className="text-sm font-bold">No pricing requests yet.</p>
              <p className="text-xs mt-1">Click "New Request" to send your first request to agents.</p>
            </div>
          ) : requests.map(r => (
            <div key={r._id} className="shipment-card border border-slate-800 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[10px] font-black text-slate-500 font-mono">{r.requestNumber}</span>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${STATUS_COLOR[r.status]}`}>{r.status.replace('_', ' ')}</span>
                  {r.lastResponseAt && <span className="text-[9px] font-black text-blue-400 bg-blue-950/20 border border-blue-800/20 px-2 py-0.5 rounded-full">New Response</span>}
                </div>
                <p className="font-black text-slate-100">{r.productName}</p>
                <p className="text-xs text-slate-400 mt-0.5">For: {r.customerName} · {r.quantity} {r.unit} · {r.assignedAgents?.length || 0} agent{r.assignedAgents?.length !== 1 ? 's' : ''}</p>
                {r.deadline && <p className="text-[10px] text-slate-500 mt-1">Deadline: {r.deadline}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/admin/pricing/${r._id}`} className="btn btn-primary py-2 px-4 text-xs">View →</Link>
                <button onClick={() => handleDeleteRequest(r._id)} className="p-2 text-slate-500 hover:text-rose-400 rounded-lg transition-colors"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── AGENTS TAB ── */}
      {tab === 'agents' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowNewAgent(true)} className="btn btn-primary flex items-center gap-2"><Plus size={14} /> Add Agent</button>
          </div>
          {agentsLoading ? (
            <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-[#F15D38]" /></div>
          ) : agents.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Users size={40} className="mx-auto mb-4 opacity-30" />
              <p className="text-sm font-bold">No agents yet.</p>
              <p className="text-xs mt-1">Add your first sourcing agent to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {agents.map(a => {
                const online = isOnline(a.lastSeen);
                return (
                  <div key={a._id} className={`shipment-card border transition-all ${a.active ? 'border-slate-800' : 'border-slate-800/40 opacity-60'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Online dot */}
                        <div className="mt-1 shrink-0">
                          <div className={`w-2.5 h-2.5 rounded-full ${online ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' : 'bg-slate-600'}`} title={online ? 'Online' : `Last seen ${lastSeenText(a.lastSeen)}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-slate-100">{a.name}</p>
                          <p className="text-xs text-slate-400 font-bold flex items-center gap-1 mt-0.5"><Globe size={11} /> {a.city}, {a.country}</p>
                          <p className="text-[10px] text-slate-500 mt-1 font-mono">@{a.username} · {LANG_LABEL[a.language] || a.language}</p>
                          {a.phone && <p className="text-[10px] text-slate-500">{a.phone}</p>}
                          <p className="text-[10px] mt-1 font-bold">
                            {online
                              ? <span className="text-emerald-400">● Online</span>
                              : <span className="text-slate-600">Last seen {lastSeenText(a.lastSeen)}</span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Edit */}
                        <button onClick={() => openEditAgent(a)} className="p-2 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors" title="Edit agent">
                          <Pencil size={14} />
                        </button>
                        {/* Enable/Disable toggle */}
                        <button onClick={() => handleToggleAgent(a)}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${a.active ? 'bg-emerald-950/20 text-emerald-400 border-emerald-800/20 hover:bg-rose-950/20 hover:text-rose-400 hover:border-rose-800/20' : 'bg-slate-900 text-slate-500 border-slate-800 hover:bg-emerald-950/20 hover:text-emerald-400 hover:border-emerald-800/20'}`}
                          title={a.active ? 'Click to disable' : 'Click to enable'}>
                          {a.active ? 'Active' : 'Disabled'}
                        </button>
                        {/* Delete */}
                        <button onClick={() => handleDeleteAgent(a._id, a.name)} className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition-colors" title="Delete agent">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-800/40">
                      <p className="text-[9px] text-slate-600 font-bold">Login URL: <span className="text-slate-500 font-mono">qcargologistics.com/agent</span></p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── NEW REQUEST MODAL ── */}
      {showNewReq && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowNewReq(false)}>
          <div className="bg-[#0B0F19] border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-100">New Pricing Request</h3>
              <button onClick={() => setShowNewReq(false)} className="p-2 text-slate-400 hover:text-slate-200"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Customer Name *</label>
                  <input type="text" required value={rCustomer} onChange={e => setRCustomer(e.target.value)} className="search-input w-full" placeholder="e.g. Ahmed Mohamed" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Product Name *</label>
                  <input type="text" required value={rProduct} onChange={e => setRProduct(e.target.value)} className="search-input w-full" placeholder="e.g. iPhone 15 Cases" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Description / Specifications</label>
                <textarea value={rDesc} onChange={e => setRDesc(e.target.value)} rows={3} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#F15D38] resize-none" placeholder="Color, size, material, brand preferences, quality level..." />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Quantity *</label>
                  <input type="number" required min="1" value={rQty} onChange={e => setRQty(e.target.value)} className="search-input w-full" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Unit</label>
                  <select value={rUnit} onChange={e => setRUnit(e.target.value)} className="search-input w-full bg-[#0B0F19]">
                    {['pcs', 'kg', 'sets', 'boxes', 'pairs', 'rolls', 'meters'].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Budget (USD)</label>
                  <input type="number" step="0.01" value={rBudget} onChange={e => setRBudget(e.target.value)} className="search-input w-full" placeholder="Optional" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Deadline</label>
                <input type="date" value={rDeadline} onChange={e => setRDeadline(e.target.value)} className="search-input w-full" />
              </div>

              {/* Assign agents */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Assign to Agents</label>
                {agents.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No agents yet — add agents in the Agents tab first.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {agents.filter(a => a.active).map(a => (
                      <label key={a._id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${rAgents.includes(a._id) ? 'border-[#F15D38] bg-[#F15D38]/10' : 'border-slate-800 hover:border-slate-600'}`}>
                        <input type="checkbox" className="accent-[#F15D38]" checked={rAgents.includes(a._id)} onChange={e => setRAgents(prev => e.target.checked ? [...prev, a._id] : prev.filter(id => id !== a._id))} />
                        <div>
                          <p className="text-xs font-black text-slate-100">{a.name}</p>
                          <p className="text-[10px] text-slate-500">{a.city}, {a.country}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Product photos */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Product Photos (optional)</label>
                <div className="flex gap-2 flex-wrap">
                  {rPhotos.map((url, i) => (
                    <div key={i} className="relative">
                      <img src={url} alt="" className="w-20 h-20 object-cover rounded-xl border border-slate-800" />
                      <button type="button" onClick={() => setRPhotos(prev => prev.filter((_, j) => j !== i))} className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5"><X size={10} /></button>
                    </div>
                  ))}
                  <label className="w-20 h-20 border-2 border-dashed border-slate-700 hover:border-[#F15D38] rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors text-slate-500 hover:text-[#F15D38]">
                    {rUploading ? <Loader2 size={16} className="animate-spin" /> : <><ImagePlus size={16} /><span className="text-[9px] font-bold mt-1">Add</span></>}
                    <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Internal Notes</label>
                <textarea value={rNotes} onChange={e => setRNotes(e.target.value)} rows={2} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#F15D38] resize-none" placeholder="Notes visible only to you, not to agents..." />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowNewReq(false)} className="btn bg-[#131B2E] border border-slate-800 text-slate-300 px-6">Cancel</button>
                <button type="submit" disabled={rSaving} className="btn btn-primary px-8 flex items-center gap-2">
                  {rSaving ? <Loader2 size={14} className="animate-spin" /> : null} Send Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── NEW AGENT MODAL ── */}
      {showNewAgent && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowNewAgent(false)}>
          <div className="bg-[#0B0F19] border border-slate-800 rounded-3xl w-full max-w-md p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-100">Add Agent</h3>
              <button onClick={() => setShowNewAgent(false)} className="p-2 text-slate-400 hover:text-slate-200"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateAgent} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Full Name *</label>
                  <input type="text" required value={aName} onChange={e => setAName(e.target.value)} className="search-input w-full" placeholder="Agent name" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">City *</label>
                  <input type="text" required value={aCity} onChange={e => setACity(e.target.value)} className="search-input w-full" placeholder="e.g. Yiwu" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Country</label>
                  <select value={aCountry} onChange={e => setACountry(e.target.value)} className="search-input w-full bg-[#0B0F19]">
                    {['China', 'UAE', 'Hong Kong', 'Turkey', 'India', 'Somalia', 'Ethiopia', 'Kenya', 'Other'].map(c => <option key={c}>{c}</option>)}
                  </select>
                  {aCountry === 'Other' && (
                    <input type="text" value={aCountryCustom} onChange={e => setACountryCustom(e.target.value)} placeholder="Type country name..." className="search-input w-full mt-2" required />
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Language</label>
                  <select value={aLang} onChange={e => setALang(e.target.value)} className="search-input w-full bg-[#0B0F19]">
                    <option value="en">English</option>
                    <option value="ar">Arabic</option>
                    <option value="zh">Chinese</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Phone / WeChat</label>
                <input type="text" value={aPhone} onChange={e => setAPhone(e.target.value)} className="search-input w-full" placeholder="+86 ..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Username *</label>
                  <input type="text" required value={aUser} onChange={e => setAUser(e.target.value)} className="search-input w-full font-mono" placeholder="e.g. yiwu_agent" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Password *</label>
                  <input type="text" required value={aPass} onChange={e => setAPass(e.target.value)} className="search-input w-full" placeholder="Set a password" />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowNewAgent(false)} className="btn bg-[#131B2E] border border-slate-800 text-slate-300 px-6">Cancel</button>
                <button type="submit" disabled={aSaving} className="btn btn-primary px-8 flex items-center gap-2">
                  {aSaving ? <Loader2 size={14} className="animate-spin" /> : null} Add Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT AGENT MODAL ── */}
      {showEditAgent && editingAgent && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowEditAgent(false)}>
          <div className="bg-[#0B0F19] border border-slate-800 rounded-3xl w-full max-w-md p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-100">Edit Agent — {editingAgent.name}</h3>
              <button onClick={() => setShowEditAgent(false)} className="p-2 text-slate-400 hover:text-slate-200"><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveEditAgent} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Full Name *</label>
                  <input type="text" required value={eaName} onChange={e => setEaName(e.target.value)} className="search-input w-full" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">City *</label>
                  <input type="text" required value={eaCity} onChange={e => setEaCity(e.target.value)} className="search-input w-full" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Country</label>
                  <select value={eaCountry} onChange={e => setEaCountry(e.target.value)} className="search-input w-full bg-[#0B0F19]">
                    {['China','UAE','Hong Kong','Turkey','India','Somalia','Ethiopia','Kenya','Other'].map(c => <option key={c}>{c}</option>)}
                  </select>
                  {eaCountry === 'Other' && (
                    <input type="text" value={eaCountryCustom} onChange={e => setEaCountryCustom(e.target.value)} placeholder="Type country name..." className="search-input w-full mt-2" required />
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Language</label>
                  <select value={eaLang} onChange={e => setEaLang(e.target.value)} className="search-input w-full bg-[#0B0F19]">
                    <option value="en">English</option>
                    <option value="ar">Arabic</option>
                    <option value="zh">Chinese</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Phone / WeChat</label>
                <input type="text" value={eaPhone} onChange={e => setEaPhone(e.target.value)} className="search-input w-full" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Username *</label>
                  <input type="text" required value={eaUser} onChange={e => setEaUser(e.target.value)} className="search-input w-full font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">New Password</label>
                  <input type="text" value={eaPass} onChange={e => setEaPass(e.target.value)} className="search-input w-full" placeholder="Leave blank to keep current" />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowEditAgent(false)} className="btn bg-[#131B2E] border border-slate-800 text-slate-300 px-6">Cancel</button>
                <button type="submit" disabled={eaSaving} className="btn btn-primary px-8 flex items-center gap-2">
                  {eaSaving ? <Loader2 size={14} className="animate-spin" /> : null} Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
