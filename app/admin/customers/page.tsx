'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  UserPlus, Search, Phone, MapPin, Filter, TrendingUp, AlertCircle,
  Pencil, Trash2, Download, Star, Users, Bell, MessageSquare,
  Plus, Loader2, CheckCircle2, Clock, Target, ChevronRight, X,
} from 'lucide-react';
import CustomerHistoryModal from './CustomerHistoryModal';

// ── Types ────────────────────────────────────────────────────────────────────
interface Customer { id: string; name: string; phone: string; city: string; totalShipments: number; totalSpent: number; balance: number; status: 'VIP' | 'ACTIVE'; }
interface Lead     { _id: string; name: string; phone: string; source: string; stage: 'NEW'|'CONTACTED'|'QUOTED'|'WON'|'LOST'; estimatedValue: number; notes: string; assignee: string; createdAt: string; }
interface FollowUp { _id: string; customerId: string; customerName: string; dueDate: string; note: string; status: 'PENDING'|'DONE'; }

type CRMTab = 'customers' | 'leads' | 'followups' | 'activity';
type LeadStage = 'NEW'|'CONTACTED'|'QUOTED'|'WON'|'LOST';

const STAGE_META: Record<LeadStage, { label: string; color: string; bg: string; border: string }> = {
  NEW:       { label: 'New Lead',   color: 'text-slate-400',   bg: 'bg-slate-900',       border: 'border-slate-700' },
  CONTACTED: { label: 'Contacted',  color: 'text-blue-400',    bg: 'bg-blue-950/30',     border: 'border-blue-800/30' },
  QUOTED:    { label: 'Quoted',     color: 'text-amber-400',   bg: 'bg-amber-950/30',    border: 'border-amber-800/30' },
  WON:       { label: 'Won',        color: 'text-emerald-400', bg: 'bg-emerald-950/30',  border: 'border-emerald-800/30' },
  LOST:      { label: 'Lost',       color: 'text-rose-400',    bg: 'bg-rose-950/30',     border: 'border-rose-800/30' },
};

const SOURCE_LABELS: Record<string, string> = {
  WHATSAPP: 'WhatsApp', REFERRAL: 'Referral', WALK_IN: 'Walk-in', SOCIAL: 'Social', OTHER: 'Other',
};

const DEFAULT_CUSTOMERS: Customer[] = [
  { id: '1', name: 'Mustafe Ismail', phone: '+252 63 777 8986', city: 'Hargeisa', totalShipments: 12, totalSpent: 4500, balance: 0, status: 'VIP' },
  { id: '2', name: 'Sahra Hassan',   phone: '+252 63 444 2211', city: 'Berbera',  totalShipments: 3,  totalSpent: 850,  balance: 150, status: 'ACTIVE' },
];

export default function CustomersPage() {
  const [activeTab, setActiveTab] = useState<CRMTab>('customers');

  // ── Customers ──
  const [customers, setCustomers]   = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [historyId, setHistoryId]   = useState<string | null>(null);
  const [cName, setCName] = useState(''); const [cPhone, setCPhone] = useState('');
  const [cCity, setCCity] = useState('Hargeisa'); const [cStatus, setCStatus] = useState<'ACTIVE'|'VIP'>('ACTIVE');
  const [cShipments, setCShipments] = useState('0'); const [cSpent, setCSpent] = useState('0'); const [cBalance, setCBalance] = useState('0');

  // ── Leads ──
  const [leads, setLeads]               = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [editingLead, setEditingLead]   = useState<Lead | null>(null);
  const [lName, setLName] = useState(''); const [lPhone, setLPhone] = useState('');
  const [lSource, setLSource] = useState('WHATSAPP'); const [lStage, setLStage] = useState<LeadStage>('NEW');
  const [lValue, setLValue] = useState(''); const [lNotes, setLNotes] = useState(''); const [lAssignee, setLAssignee] = useState('');
  const [savingLead, setSavingLead] = useState(false);
  const [dragOver, setDragOver] = useState<LeadStage | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // ── Follow-ups ──
  const [followups, setFollowups]         = useState<FollowUp[]>([]);
  const [followupsLoading, setFollowupsLoading] = useState(false);
  const [fuFilter, setFuFilter]           = useState<'all'|'pending'|'done'>('pending');

  // ── Activity (recent notes across all customers) ──
  const [activity, setActivity]         = useState<{ _id: string; customerName: string; type: string; text: string; createdAt: string }[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  // ── Load ──────────────────────────────────────────────────────────────────
  const loadCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCustomers(data.map((c: any) => ({ id: c._id || c.id, name: c.name, phone: c.phone, city: c.city || 'Hargeisa', totalShipments: c.totalShipments || 0, totalSpent: c.totalSpent || 0, balance: c.balance || 0, status: c.status || 'ACTIVE' })));
    } catch { setCustomers(DEFAULT_CUSTOMERS); }
  };

  const loadLeads = async () => {
    setLeadsLoading(true);
    try { const res = await fetch('/api/crm/leads'); const data = await res.json(); setLeads(Array.isArray(data) ? data : []); }
    catch { /* ignore */ } finally { setLeadsLoading(false); }
  };

  const loadFollowups = async () => {
    setFollowupsLoading(true);
    try { const res = await fetch('/api/crm/followups'); const data = await res.json(); setFollowups(Array.isArray(data) ? data : []); }
    catch { /* ignore */ } finally { setFollowupsLoading(false); }
  };

  const loadActivity = async () => {
    setActivityLoading(true);
    try { const res = await fetch('/api/crm/notes'); const data = await res.json(); setActivity(Array.isArray(data) ? data : []); }
    catch { /* ignore */ } finally { setActivityLoading(false); }
  };

  useEffect(() => { loadCustomers(); }, []);
  useEffect(() => { if (activeTab === 'leads')    loadLeads(); },     [activeTab]);
  useEffect(() => { if (activeTab === 'followups') loadFollowups(); }, [activeTab]);
  useEffect(() => { if (activeTab === 'activity')  loadActivity(); },  [activeTab]);

  // ── Customer CRUD ─────────────────────────────────────────────────────────
  const openAddModal = () => { setIsEditMode(false); setEditingId(null); setCName(''); setCPhone(''); setCCity('Hargeisa'); setCStatus('ACTIVE'); setCShipments('0'); setCSpent('0'); setCBalance('0'); setShowModal(true); };
  const openEditModal = (c: Customer) => { setIsEditMode(true); setEditingId(c.id); setCName(c.name); setCPhone(c.phone); setCCity(c.city); setCStatus(c.status); setCShipments(c.totalShipments.toString()); setCSpent(c.totalSpent.toString()); setCBalance(c.balance.toString()); setShowModal(true); };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName.trim() || !cPhone.trim()) return alert('Name and phone required');
    const payload = { name: cName, phone: cPhone, city: cCity, status: cStatus, totalShipments: parseInt(cShipments)||0, totalSpent: parseFloat(cSpent)||0, balance: parseFloat(cBalance)||0 };
    try {
      if (isEditMode && editingId) {
        const res = await fetch(`/api/customers?id=${editingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error('Failed to update');
        const updated = await res.json();
        setCustomers(prev => prev.map(c => c.id === editingId ? { ...updated, id: updated._id || updated.id } : c));
      } else {
        const res = await fetch('/api/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error('Failed to create');
        const saved = await res.json();
        setCustomers(prev => [{ ...saved, id: saved._id || saved.id }, ...prev]);
      }
      setShowModal(false);
    } catch (err: any) { alert(err.message); }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm('Delete this customer?')) return;
    await fetch(`/api/customers?id=${id}`, { method: 'DELETE' });
    setCustomers(prev => prev.filter(c => c.id !== id));
  };

  const handleExport = () => {
    const csv = ['Customer Name,Phone,City,Shipments,Total Spent,Balance,Tier'].concat(customers.map(c => `"${c.name}","${c.phone}","${c.city}",${c.totalShipments},${c.totalSpent},${c.balance},"${c.status}"`)).join('\n');
    const link = document.createElement('a'); link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`; link.download = 'qcargo_customers.csv'; link.click();
  };

  // ── Lead CRUD ─────────────────────────────────────────────────────────────
  const openLeadModal = (lead?: Lead) => {
    if (lead) { setEditingLead(lead); setLName(lead.name); setLPhone(lead.phone); setLSource(lead.source); setLStage(lead.stage); setLValue(String(lead.estimatedValue||'')); setLNotes(lead.notes||''); setLAssignee(lead.assignee||''); }
    else { setEditingLead(null); setLName(''); setLPhone(''); setLSource('WHATSAPP'); setLStage('NEW'); setLValue(''); setLNotes(''); setLAssignee(''); }
    setShowLeadModal(true);
  };

  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lName.trim()) return alert('Name required');
    setSavingLead(true);
    const payload = { name: lName, phone: lPhone, source: lSource, stage: lStage, estimatedValue: parseFloat(lValue)||0, notes: lNotes, assignee: lAssignee };
    try {
      if (editingLead) {
        const res = await fetch(`/api/crm/leads?id=${editingLead._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const updated = await res.json();
        setLeads(prev => prev.map(l => l._id === editingLead._id ? updated : l));
      } else {
        const res = await fetch('/api/crm/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const saved = await res.json();
        setLeads(prev => [saved, ...prev]);
      }
      setShowLeadModal(false);
    } catch (err: any) { alert(err.message); }
    finally { setSavingLead(false); }
  };

  const handleDeleteLead = async (id: string) => {
    if (!confirm('Delete this lead?')) return;
    await fetch(`/api/crm/leads?id=${id}`, { method: 'DELETE' });
    setLeads(prev => prev.filter(l => l._id !== id));
  };

  const handleMoveStage = async (leadId: string, stage: LeadStage) => {
    await fetch(`/api/crm/leads?id=${leadId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stage }) });
    setLeads(prev => prev.map(l => l._id === leadId ? { ...l, stage } : l));
  };

  // ── Follow-up actions ─────────────────────────────────────────────────────
  const toggleFollowUp = async (fu: FollowUp) => {
    const newStatus = fu.status === 'DONE' ? 'PENDING' : 'DONE';
    await fetch(`/api/crm/followups?id=${fu._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
    setFollowups(prev => prev.map(f => f._id === fu._id ? { ...f, status: newStatus } : f));
  };

  const deleteFollowUp = async (id: string) => {
    await fetch(`/api/crm/followups?id=${id}`, { method: 'DELETE' });
    setFollowups(prev => prev.filter(f => f._id !== id));
  };

  // ── Derived data ──────────────────────────────────────────────────────────
  const filteredCustomers = useMemo(() => customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm) || c.city.toLowerCase().includes(searchTerm.toLowerCase())), [customers, searchTerm]);
  const leadsBy = useMemo(() => (stage: LeadStage) => leads.filter(l => l.stage === stage), [leads]);
  const pendingFollowups = followups.filter(f => f.status === 'PENDING');
  const overdueCount = pendingFollowups.filter(f => f.dueDate < today).length;
  const filteredFollowups = useMemo(() => {
    if (fuFilter === 'pending') return followups.filter(f => f.status === 'PENDING');
    if (fuFilter === 'done')    return followups.filter(f => f.status === 'DONE');
    return followups;
  }, [followups, fuFilter]);

  const NOTE_TYPE_STYLES: Record<string, string> = {
    NOTE: 'bg-slate-900 text-slate-400 border border-slate-800',
    CALL: 'bg-blue-950/30 text-blue-400 border border-blue-800/20',
    MEETING: 'bg-emerald-950/30 text-emerald-400 border border-emerald-800/20',
    COMPLAINT: 'bg-rose-950/30 text-rose-400 border border-rose-800/20',
  };

  const TABS = [
    { id: 'customers' as CRMTab, label: 'Customers',   icon: Users,    badge: customers.length },
    { id: 'leads'     as CRMTab, label: 'Lead Pipeline', icon: Target,  badge: leads.filter(l => l.stage !== 'WON' && l.stage !== 'LOST').length },
    { id: 'followups' as CRMTab, label: 'Follow-ups',  icon: Bell,     badge: overdueCount || pendingFollowups.length, badgeAlert: overdueCount > 0 },
    { id: 'activity'  as CRMTab, label: 'Activity Log', icon: MessageSquare, badge: 0 },
  ];

  return (
    <div className="admin-container pb-20">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight">Customer CRM</h1>
          <p className="text-slate-400 font-medium">Customers · Lead pipeline · Follow-ups · Activity log</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExport} className="btn bg-white border border-slate-800 text-slate-300 flex items-center gap-2 hover:bg-slate-800"><Download size={16} /> Export</button>
          <button onClick={openAddModal} className="btn btn-primary flex items-center gap-2 shadow-lg shadow-[#F15D38]/20"><UserPlus size={16} /> Add Customer</button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Customers',    value: customers.length,                                       icon: Users,         color: 'text-[#F15D38]', bg: 'bg-[#F15D38]/10 border-[#F15D38]/20' },
          { label: 'Active Leads',       value: leads.filter(l=>l.stage!=='WON'&&l.stage!=='LOST').length, icon: Target,     color: 'text-blue-400',  bg: 'bg-blue-950/20 border-blue-800/20' },
          { label: 'Follow-ups Due',     value: pendingFollowups.length,                                icon: Bell,          color: overdueCount>0 ? 'text-rose-400':'text-amber-400', bg: overdueCount>0?'bg-rose-950/20 border-rose-800/20':'bg-amber-950/20 border-amber-800/20' },
          { label: 'VIP Customers',      value: customers.filter(c=>c.status==='VIP').length,           icon: Star,          color: 'text-amber-400', bg: 'bg-amber-950/20 border-amber-800/20' },
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
      <div className="flex gap-1 p-1 bg-slate-900 border border-slate-800 rounded-[1.5rem] mb-8 overflow-x-auto">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-[#F15D38] text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}>
            <tab.icon size={13} />{tab.label}
            {tab.badge > 0 && <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${activeTab === tab.id ? 'bg-white/20' : tab.badgeAlert ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-300'}`}>{tab.badge}</span>}
          </button>
        ))}
      </div>

      {/* ── CUSTOMERS TAB ── */}
      {activeTab === 'customers' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#F15D38] transition-colors" size={18} />
              <input type="text" placeholder="Search by name, phone, city…" className="search-input !pl-12 w-full" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="shipment-card !p-0 overflow-hidden border border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-900/40 border-b border-slate-800">
                    {['Customer','Location','Shipments','Tier','Balance','Actions'].map(h => <th key={h} className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredCustomers.map(c => (
                    <tr key={c.id} onClick={() => setHistoryId(c.id)} className="hover:bg-slate-800/30 transition-all group cursor-pointer">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center font-black text-slate-400 text-xs">{c.name.split(' ').map(n=>n[0]).join('')}</div>
                          <div><p className="font-bold text-slate-100">{c.name}</p><p className="text-[10px] font-bold text-slate-500 font-mono mt-0.5">{c.phone}</p></div>
                        </div>
                      </td>
                      <td className="px-6 py-5"><div className="flex items-center gap-2"><MapPin size={12} className="text-slate-500" /><span className="text-xs font-bold text-slate-300">{c.city}</span></div></td>
                      <td className="px-6 py-5"><span className="font-bold text-slate-100">{c.totalShipments}</span><span className="text-[10px] text-slate-500 ml-1 uppercase">orders</span></td>
                      <td className="px-6 py-5">
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full ${c.status === 'VIP' ? 'bg-amber-950/30 text-amber-400 border border-amber-800/20' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}>{c.status}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`font-black text-sm ${c.balance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{c.balance > 0 ? `-$${c.balance.toFixed(2)}` : 'CLEAR'}</span>
                        <p className="text-[10px] text-slate-500 mt-0.5">Total: ${c.totalSpent.toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-5">
                        <div onClick={e => e.stopPropagation()} className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEditModal(c)} className="p-2 hover:bg-slate-800 text-slate-400 hover:text-slate-100 rounded-lg transition-colors"><Pencil size={15} /></button>
                          <button onClick={() => handleDeleteCustomer(c.id)} className="p-2 hover:bg-rose-950/30 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"><Trash2 size={15} /></button>
                          <button onClick={() => setHistoryId(c.id)} className="p-2 hover:bg-slate-800 text-slate-400 hover:text-[#F15D38] rounded-lg transition-colors" title="View CRM profile"><ChevronRight size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredCustomers.length === 0 && <tr><td colSpan={6} className="px-6 py-12 text-center text-xs font-bold text-slate-500">No customers found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── LEADS PIPELINE TAB ── */}
      {activeTab === 'leads' && (
        <div className="animate-in fade-in duration-300">
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-xs font-bold text-slate-400">{leads.length} total leads · <span className="text-emerald-400">{leads.filter(l=>l.stage==='WON').length} won</span> · <span className="text-rose-400">{leads.filter(l=>l.stage==='LOST').length} lost</span></p>
            </div>
            <button onClick={() => openLeadModal()} className="btn btn-primary flex items-center gap-2 shadow-lg shadow-[#F15D38]/20"><Plus size={15} /> Add Lead</button>
          </div>

          {leadsLoading ? (
            <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-[#F15D38]" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {(Object.keys(STAGE_META) as LeadStage[]).map(stage => {
                const meta  = STAGE_META[stage];
                const cards = leadsBy(stage);
                return (
                  <div key={stage}
                    onDragOver={e => { e.preventDefault(); setDragOver(stage); }}
                    onDragLeave={() => setDragOver(null)}
                    onDrop={async e => { e.preventDefault(); if (draggingId) { await handleMoveStage(draggingId, stage); setDraggingId(null); } setDragOver(null); }}
                    className={`rounded-2xl p-4 border min-h-[200px] transition-all ${dragOver === stage ? 'border-[#F15D38]/60 bg-[#F15D38]/5' : `border-slate-800 bg-slate-900/30`}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${meta.color}`}>{meta.label}</p>
                        <p className="text-[10px] text-slate-500 font-bold mt-0.5">{cards.length} lead{cards.length !== 1 ? 's' : ''}</p>
                      </div>
                      {cards.length > 0 && <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${meta.bg} ${meta.color} ${meta.border}`}>{cards.length}</span>}
                    </div>
                    <div className="space-y-3">
                      {cards.map(lead => (
                        <div key={lead._id}
                          draggable
                          onDragStart={() => setDraggingId(lead._id)}
                          onDragEnd={() => setDraggingId(null)}
                          className="bg-[#0B0F19] border border-slate-800 rounded-xl p-3 cursor-grab active:cursor-grabbing group hover:border-slate-700 transition-all">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-bold text-slate-100 text-sm truncate">{lead.name}</p>
                              {lead.phone && <p className="text-[10px] font-bold text-slate-500 mt-0.5 font-mono">{lead.phone}</p>}
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <button onClick={() => openLeadModal(lead)} className="p-1 text-slate-500 hover:text-slate-200 rounded"><Pencil size={12} /></button>
                              <button onClick={() => handleDeleteLead(lead._id)} className="p-1 text-slate-500 hover:text-rose-400 rounded"><Trash2 size={12} /></button>
                            </div>
                          </div>
                          {lead.estimatedValue > 0 && <p className="text-[10px] font-black text-emerald-400 mt-2">${lead.estimatedValue.toLocaleString()}</p>}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[9px] font-bold text-slate-500 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5">{SOURCE_LABELS[lead.source] || lead.source}</span>
                            {lead.assignee && <span className="text-[9px] font-bold text-slate-500">@{lead.assignee}</span>}
                          </div>
                          {lead.notes && <p className="text-[10px] text-slate-500 mt-2 line-clamp-2">{lead.notes}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── FOLLOW-UPS TAB ── */}
      {activeTab === 'followups' && (
        <div className="animate-in fade-in duration-300 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
              {(['pending','all','done'] as const).map(f => (
                <button key={f} onClick={() => setFuFilter(f)}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${fuFilter === f ? 'bg-[#F15D38] text-white' : 'text-slate-400 hover:text-slate-200'}`}>
                  {f === 'pending' ? `Pending (${pendingFollowups.length})` : f === 'done' ? 'Done' : 'All'}
                </button>
              ))}
            </div>
            {overdueCount > 0 && <span className="text-[10px] font-black text-rose-400 bg-rose-950/20 border border-rose-800/20 px-3 py-1.5 rounded-xl">{overdueCount} overdue</span>}
          </div>

          {followupsLoading ? (
            <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-[#F15D38]" /></div>
          ) : filteredFollowups.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Bell size={40} className="mx-auto mb-4 opacity-30" />
              <p className="text-sm font-bold">No follow-ups here.</p>
              <p className="text-xs mt-1">Open a customer profile to set a follow-up reminder.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFollowups.map(fu => {
                const isOverdue = fu.status === 'PENDING' && fu.dueDate < today;
                const isToday   = fu.dueDate === today;
                return (
                  <div key={fu._id} className={`shipment-card border flex items-start gap-4 py-4 ${fu.status === 'DONE' ? 'opacity-40 border-slate-800' : isOverdue ? 'border-rose-800/40 bg-rose-950/5' : isToday ? 'border-amber-800/40 bg-amber-950/5' : 'border-slate-800'}`}>
                    <button onClick={() => toggleFollowUp(fu)} className="shrink-0 mt-0.5">
                      {fu.status === 'DONE' ? <CheckCircle2 size={20} className="text-emerald-500" /> : <Clock size={20} className={isOverdue ? 'text-rose-400' : isToday ? 'text-amber-400' : 'text-slate-500'} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-black text-slate-100">{fu.customerName}</p>
                        <span className={`text-[10px] font-black ${isOverdue ? 'text-rose-400' : isToday ? 'text-amber-400' : 'text-slate-500'}`}>{isOverdue ? '· OVERDUE' : isToday ? '· TODAY' : ''} · {fu.dueDate}</span>
                      </div>
                      <p className={`text-sm font-bold ${fu.status === 'DONE' ? 'line-through text-slate-500' : 'text-slate-300'}`}>{fu.note}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => setHistoryId(fu.customerId)} className="text-[10px] font-black text-slate-500 hover:text-[#F15D38] transition-colors px-2 py-1 rounded-lg hover:bg-slate-800">View</button>
                      <button onClick={() => deleteFollowUp(fu._id)} className="p-2 text-slate-600 hover:text-rose-400 rounded-lg transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── ACTIVITY LOG TAB ── */}
      {activeTab === 'activity' && (
        <div className="animate-in fade-in duration-300 space-y-4">
          <p className="text-xs font-bold text-slate-400">All recent interactions across all customers — newest first.</p>
          {activityLoading ? (
            <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-[#F15D38]" /></div>
          ) : activity.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <MessageSquare size={40} className="mx-auto mb-4 opacity-30" />
              <p className="text-sm font-bold">No activity yet.</p>
              <p className="text-xs mt-1">Open a customer and log a call, note, or meeting.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activity.map(note => (
                <div key={note._id} className="shipment-card border border-slate-800 flex items-start gap-4 py-4">
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${
                    note.type === 'CALL' ? 'bg-blue-950/30 text-blue-400 border border-blue-800/20' :
                    note.type === 'MEETING' ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-800/20' :
                    note.type === 'COMPLAINT' ? 'bg-rose-950/30 text-rose-400 border border-rose-800/20' :
                    'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}>{note.type[0]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-black text-slate-100">{note.customerName}</p>
                      <span className="text-[10px] font-bold text-slate-500">{new Date(note.createdAt).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}</span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${NOTE_TYPE_STYLES[note.type] || 'bg-slate-900 text-slate-400 border border-slate-800'}`}>{note.type}</span>
                    </div>
                    <p className="text-sm text-slate-300">{note.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Customer history modal */}
      <CustomerHistoryModal customerId={historyId} onClose={() => setHistoryId(null)} />

      {/* ── ADD/EDIT CUSTOMER MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0B0F19] border border-slate-800 rounded-3xl w-full max-w-lg p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-100">{isEditMode ? 'Edit Customer' : 'Add Customer'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-200 rounded-lg"><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveCustomer} className="space-y-4">
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Full Name</label><input type="text" value={cName} onChange={e=>setCName(e.target.value)} placeholder="e.g. Mustafe Ismail" className="search-input w-full" required /></div>
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Phone</label><input type="text" value={cPhone} onChange={e=>setCPhone(e.target.value)} placeholder="+252 63 xxxxxxx" className="search-input w-full" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">City</label><input type="text" value={cCity} onChange={e=>setCCity(e.target.value)} className="search-input w-full" /></div>
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tier</label>
                  <select value={cStatus} onChange={(e:any)=>setCStatus(e.target.value)} className="search-input w-full bg-[#0B0F19]"><option value="ACTIVE">ACTIVE</option><option value="VIP">VIP</option></select>
                </div>
              </div>
              {isEditMode && (
                <div className="grid grid-cols-3 gap-3 border-t border-slate-800/60 pt-4">
                  <div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Shipments</label><input type="number" value={cShipments} onChange={e=>setCShipments(e.target.value)} className="search-input w-full text-xs" /></div>
                  <div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Total Spent</label><input type="number" value={cSpent} onChange={e=>setCSpent(e.target.value)} className="search-input w-full text-xs" /></div>
                  <div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Balance</label><input type="number" value={cBalance} onChange={e=>setCBalance(e.target.value)} className="search-input w-full text-xs" /></div>
                </div>
              )}
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn bg-[#131B2E] border border-slate-800 text-slate-300 px-6">Cancel</button>
                <button type="submit" className="btn btn-primary px-8">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ADD/EDIT LEAD MODAL ── */}
      {showLeadModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0B0F19] border border-slate-800 rounded-3xl w-full max-w-lg p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-100">{editingLead ? 'Edit Lead' : 'Add Lead'}</h3>
              <button onClick={() => setShowLeadModal(false)} className="p-2 text-slate-400 hover:text-slate-200 rounded-lg"><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveLead} className="space-y-4">
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Name *</label><input type="text" value={lName} onChange={e=>setLName(e.target.value)} placeholder="Lead name" className="search-input w-full" required /></div>
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Phone</label><input type="text" value={lPhone} onChange={e=>setLPhone(e.target.value)} placeholder="+252 63 xxxxxxx" className="search-input w-full" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Source</label>
                  <select value={lSource} onChange={(e:any)=>setLSource(e.target.value)} className="search-input w-full bg-[#0B0F19]">
                    {Object.entries(SOURCE_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Stage</label>
                  <select value={lStage} onChange={(e:any)=>setLStage(e.target.value)} className="search-input w-full bg-[#0B0F19]">
                    {(Object.keys(STAGE_META) as LeadStage[]).map(s => <option key={s} value={s}>{STAGE_META[s].label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Est. Value ($)</label><input type="number" value={lValue} onChange={e=>setLValue(e.target.value)} placeholder="0" className="search-input w-full" /></div>
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Assignee</label><input type="text" value={lAssignee} onChange={e=>setLAssignee(e.target.value)} placeholder="Staff name" className="search-input w-full" /></div>
              </div>
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Notes</label><textarea value={lNotes} onChange={e=>setLNotes(e.target.value)} placeholder="Any notes about this lead..." rows={3} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#F15D38] resize-none" /></div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowLeadModal(false)} className="btn bg-[#131B2E] border border-slate-800 text-slate-300 px-6">Cancel</button>
                <button type="submit" disabled={savingLead} className="btn btn-primary px-8 flex items-center gap-2">
                  {savingLead && <Loader2 size={14} className="animate-spin" />}Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
