'use client';

import { useState, useEffect, use } from 'react';
import {
  ArrowLeft, Save, Package, Truck, DollarSign, Plus, Trash2,
  CheckCircle2, User, Scale, Box, Calendar, FileText,
  ChevronDown, ChevronRight, Check, Clock, StickyNote
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EXPENSE_PAYMENT_METHODS } from '@/lib/payment-methods';

// Quick-pick categories for batch expenses (arrival/handling costs first).
const BATCH_EXPENSE_CATEGORIES = [
  'Port-to-Office Transport',
  'Loading / Offloading Labor',
  'Customs',
  'Trucking',
  'Warehousing',
  'Port Taxes',
  'Other',
];

export default function BatchDetail({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const router = useRouter();
  
  // Handle promise or direct object params in modern Next.js
  const resolvedParams = params && 'then' in params ? use(params) : params;
  const id = resolvedParams?.id;

  const [loading, setLoading] = useState(true);
  const [batch, setBatch] = useState<any>(null);
  const [shipments, setShipments] = useState<any[]>([]);
  const [status, setStatus] = useState('IN_TRANSIT');
  const [arrivalDate, setArrivalDate] = useState('');
  
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Real batch expenses (saved in the shared Expenses section, linked to this batch)
  const [batchExpenses, setBatchExpenses] = useState<any[]>([]);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [savingExpense, setSavingExpense] = useState(false);
  const emptyExpense = {
    vendor: '', category: 'Port-to-Office Transport', amount: '', amountPaid: '',
    paymentMethod: 'CASH', date: new Date().toISOString().split('T')[0], description: '',
  };
  const [expForm, setExpForm] = useState(emptyExpense);

  const loadBatchExpenses = async (batchId: string) => {
    try {
      const res = await fetch('/api/bills');
      if (!res.ok) return;
      const all = await res.json();
      setBatchExpenses((all as any[]).filter((b) => b.batchId === batchId));
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (!id) return;
    const fetchBatchDetails = async () => {
      try {
        const res = await fetch(`/api/batches?id=${id}`);
        if (!res.ok) throw new Error('Failed to fetch batch');
        const data = await res.json();
        setBatch(data);
        setStatus(data.status || 'IN_TRANSIT');
        setArrivalDate(data.arrival || '');
        setShipments(data.shipmentsList || []);
        if (data.batchId) loadBatchExpenses(data.batchId);
      } catch (err) {
        console.error('Error fetching batch detail:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBatchDetails();
  }, [id]);

  const batchExpenseTotal = batchExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(expForm.amount) || 0;
    const paid = parseFloat(expForm.amountPaid) || 0;
    if (!expForm.vendor.trim()) { alert('Enter who you paid (vendor / service provider)'); return; }
    if (amount <= 0) { alert('Enter a valid amount'); return; }
    if (!expForm.category.trim()) { alert('Choose or type a category'); return; }
    const expStatus = paid <= 0 ? 'PENDING' : paid >= amount - 0.01 ? 'PAID' : 'PARTIAL';
    setSavingExpense(true);
    try {
      const res = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor: expForm.vendor.trim(),
          date: expForm.date,
          due: expForm.date,
          amount,
          amountPaid: paid,
          status: expStatus,
          category: expForm.category.trim(),
          paymentMethod: expForm.paymentMethod,
          batchId: batch.batchId,
          description: expForm.description.trim(),
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.details || d.error || 'Failed to save expense');
      }
      setExpForm(emptyExpense);
      setShowExpenseForm(false);
      await loadBatchExpenses(batch.batchId);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSavingExpense(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('Delete this expense? It will be removed from the Expenses section too.')) return;
    try {
      const res = await fetch(`/api/bills?id=${expenseId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete expense');
      await loadBatchExpenses(batch.batchId);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/batches?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          arrival: arrivalDate
        }),
      });

      if (!res.ok) throw new Error('Failed to update batch');
      
      alert(`Batch updated successfully!`);
      router.push('/admin/batches');
    } catch (err: any) {
      console.error(err);
      alert(`Error saving changes: ${err.message}`);
    }
  };

  const statusColors: Record<string, string> = {
    PENDING: 'bg-amber-950/30 text-amber-400 border border-amber-800/20',
    LOADING: 'bg-indigo-950/30 text-indigo-400 border border-indigo-800/20',
    IN_TRANSIT: 'bg-[#F15D38]/10 text-[#F15D38] border border-[#F15D38]/20',
    ARRIVED: 'bg-emerald-950/30 text-emerald-400 border border-emerald-800/20',
    DELIVERED: 'bg-slate-900 text-slate-400 border border-slate-800',
  };

  if (loading) {
    return (
      <div className="admin-container min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#F15D38] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 font-bold uppercase tracking-wider text-xs">Loading Live Batch Data...</p>
        </div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="admin-container">
        <div className="shipment-card text-center py-10">
          <p className="text-slate-400 font-bold">Batch not found or failed to load.</p>
          <button onClick={() => router.back()} className="mt-4 btn btn-primary py-2 px-6">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-100 tracking-tight flex items-center gap-3">
              <Package className="text-[#F15D38]" size={28} />
              Batch: {batch.batchId}
            </h1>
            <p className="text-slate-400 font-medium">Manage shipment manifest, tracking, and expenses</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/batches" className="btn bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700">
            Cancel
          </Link>
          <button onClick={handleSave} className="btn btn-primary flex items-center gap-2 shadow-lg shadow-[#F15D38]/20">
            <Save size={16} /> Save Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Dynamic Manifest Status Cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-6">
            <div className="shipment-card">
              <div className="flex items-center justify-between mb-2">
                <Box size={20} className="text-[#F15D38]" />
                <span className="text-[10px] font-black text-[#F15D38] bg-[#F15D38]/10 px-2 py-0.5 rounded uppercase tracking-wider">Automated</span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Consolidated Cartons</p>
              <h3 className="text-2xl font-black text-slate-100">{batch.totalCartons || 0} Cartons</h3>
            </div>
            <div className="shipment-card">
              <div className="flex items-center justify-between mb-2">
                <Scale size={20} className="text-emerald-400" />
                <span className="text-[10px] font-black text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded uppercase tracking-wider">Automated</span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Weight / Load</p>
              <h3 className="text-2xl font-black text-slate-100">{batch.weight || '0 KG'}</h3>
            </div>
            <div className="shipment-card">
              <div className="flex items-center justify-between mb-2">
                <Truck size={20} className="text-indigo-400" />
                <span className="text-[10px] font-black text-indigo-400 bg-indigo-950/30 px-2 py-0.5 rounded uppercase tracking-wider">Automated</span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Linked Shipments</p>
              <h3 className="text-2xl font-black text-slate-100">{shipments.length} {shipments.length === 1 ? 'Shipment' : 'Shipments'}</h3>
            </div>
            <div className="shipment-card">
              <div className="flex items-center justify-between mb-2">
                <DollarSign size={20} className="text-rose-400" />
                <span className="text-[10px] font-black text-rose-400 bg-rose-950/30 px-2 py-0.5 rounded uppercase tracking-wider">{batchExpenses.length} {batchExpenses.length === 1 ? 'Item' : 'Items'}</span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Expenses</p>
              <h3 className="text-2xl font-black text-rose-500">${batchExpenseTotal.toFixed(2)}</h3>
            </div>
          </div>

          {/* Status & Schedule Update */}
          <div className="shipment-card">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-800/40">
              <Truck size={20} className="text-[#F15D38]" />
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Shipment Status & Routing</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Flight / Container Status</label>
                <div className="flex items-center gap-4">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="search-input flex-1"
                  >
                    <option value="LOADING">Loading</option>
                    <option value="IN_TRANSIT">In Transit</option>
                    <option value="ARRIVED">Arrived</option>
                  </select>
                  <span className={`text-[10px] font-black px-4 py-2.5 rounded-xl uppercase tracking-widest border ${statusColors[status] || statusColors.PENDING}`}>
                    {status.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Estimated Date of Arrival</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input 
                    type="date" 
                    value={arrivalDate} 
                    onChange={(e) => setArrivalDate(e.target.value)} 
                    className="search-input !pl-10 w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Shipments inside this Batch */}
          <div className="shipment-card">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-800/40">
              <FileText size={20} className="text-[#F15D38]" />
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Consolidated Shipments List</h3>
            </div>
            {shipments.length === 0 ? (
              <div className="text-center py-10 bg-[#0B0F19] rounded-2xl border border-slate-800/50">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">No shipments assigned to this batch yet.</p>
                <p className="text-[10px] text-slate-600 mt-1">Add shipments to this batch using the Shipment Entry form.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {shipments.map((s) => {
                  let cartons = 0;
                  if (s.courierPackages && s.courierPackages.length > 0) {
                    cartons = s.courierPackages.reduce((sum: number, p: any) => sum + (p.qty || 1), 0);
                  } else if (s.items && s.items.length > 0) {
                    cartons = s.items.reduce((sum: number, it: any) => sum + (it.qty || 1), 0);
                  } else {
                    cartons = 1;
                  }
                  
                  const lines = buildProductLines(s);
                  const isOpen = !!expanded[s.id];
                  const receivedLines = lines.filter((l) => l.received).length;
                  const noteCount = lines.reduce((sum, l) => sum + l.notes.length, 0);

                  return (
                    <div key={s.id} className="bg-[#0B0F19] rounded-2xl border border-slate-800 hover:border-slate-700/60 transition-all overflow-hidden">
                      <button
                        onClick={() => setExpanded((prev) => ({ ...prev, [s.id]: !prev[s.id] }))}
                        className="w-full flex flex-col md:flex-row justify-between items-start md:items-center p-4 gap-4 text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500">{isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</span>
                          <div className={`p-2 rounded-lg ${s.type === 'AIR' ? 'bg-[#F15D38]/10 text-[#F15D38]' : 'bg-emerald-950/30 text-emerald-400'}`}>
                            {s.type === 'AIR' ? <PlaneIcon size={16} /> : <ShipIcon size={16} />}
                          </div>
                          <div>
                            <div className="font-mono text-sm font-black text-slate-100">{s.shipmentNumber}</div>
                            <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <User size={10} /> {s.customer}
                              <span className="text-slate-600">•</span>
                              <span>{cartons} {cartons === 1 ? 'Carton' : 'Cartons'}</span>
                              {lines.length > 0 && (
                                <>
                                  <span className="text-slate-600">•</span>
                                  <span className={receivedLines === lines.length ? 'text-emerald-400' : 'text-slate-400'}>{receivedLines}/{lines.length} arrived</span>
                                </>
                              )}
                              {noteCount > 0 && (
                                <span className="text-[#F15D38] flex items-center gap-0.5"><StickyNote size={10} /> {noteCount}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t border-slate-800/40 md:border-0 pt-3 md:pt-0">
                          <div className="text-right">
                            <div className="text-xs font-black text-slate-300">
                              {s.type === 'AIR' ? `${s.weight || 0} KG` : `${s.cbm || 0} CBM`}
                            </div>
                            <div className="text-[9px] font-black uppercase text-slate-500 mt-0.5">Loads</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-black text-[#F15D38]">${s.total?.toFixed(2)}</div>
                            <div className={`text-[8px] font-black px-1.5 py-0.5 rounded-md mt-0.5 inline-block ${s.payment === 'PAID' ? 'text-emerald-400 bg-emerald-950/20 border border-emerald-800/20' : 'text-rose-400 bg-rose-950/20 border border-rose-800/20'}`}>
                              {s.payment}
                            </div>
                          </div>
                        </div>
                      </button>

                      {isOpen && (
                        <div className="border-t border-slate-800/60 px-4 py-3 space-y-2.5">
                          {lines.length === 0 ? (
                            <p className="text-[11px] text-slate-500 font-bold py-2">No product lines on this shipment.</p>
                          ) : (
                            lines.map((l, li) => (
                              <div key={li} className="bg-[#131B2E] border border-slate-800 rounded-xl p-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="text-sm font-bold text-slate-200 break-words">{l.product}</p>
                                    <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                                      Qty: {l.qty}{l.tracking ? ` · ${l.tracking}` : ''}
                                    </p>
                                  </div>
                                  <span className={`shrink-0 flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full ${l.received ? 'text-emerald-400 bg-emerald-950/30' : 'text-slate-400 bg-slate-800/60'}`}>
                                    {l.received ? <Check size={11} /> : <Clock size={11} />}
                                    {l.received ? 'Arrived' : 'Not yet'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 mt-2 text-[11px] font-bold">
                                  <span className="text-slate-400">Measured KG: <span className={l.measuredWeight != null ? 'text-slate-100' : 'text-slate-600'}>{l.measuredWeight != null ? l.measuredWeight : '—'}</span></span>
                                  <span className="text-slate-400">Measured CBM: <span className={l.measuredCbm != null ? 'text-slate-100' : 'text-slate-600'}>{l.measuredCbm != null ? l.measuredCbm : '—'}</span></span>
                                </div>
                                {l.notes.length > 0 && (
                                  <div className="mt-2.5 space-y-1.5 border-t border-slate-800/60 pt-2.5">
                                    {l.notes.map((n, ni) => (
                                      <div key={ni} className="flex items-start gap-1.5">
                                        <StickyNote size={11} className="text-[#F15D38] mt-0.5 shrink-0" />
                                        <div className="min-w-0">
                                          <p className="text-[12px] text-slate-200 whitespace-pre-wrap break-words">{n.text}</p>
                                          <p className="text-[9px] text-slate-500 font-bold mt-0.5">{formatNoteDate(n.at)}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-8">

          {/* Shipping Documents — always visible at top */}
          <div className="bg-[#131B2E] border-2 border-[#F15D38]/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#F15D38]/10">
              <div className="p-2 rounded-xl bg-[#F15D38]/10 text-[#F15D38]">
                <FileText size={18} />
              </div>
              <div>
                <h4 className="font-black text-slate-100 text-sm uppercase tracking-widest">Shipping Documents</h4>
                <p className="text-[9px] text-slate-500 font-bold mt-0.5">Click any document to open &amp; print</p>
              </div>
            </div>
            <div className="space-y-2">
              <Link
                href={`/admin/batches/${id}/packing-list`}
                target="_blank"
                className="w-full py-2.5 text-xs font-bold text-slate-300 bg-slate-900 hover:bg-[#F15D38]/10 hover:text-[#F15D38] border border-slate-800 hover:border-[#F15D38]/30 rounded-xl transition-colors flex items-center justify-between px-4 gap-2"
              >
                <span>📄 Packing List</span>
                <span className="text-[9px] text-slate-500 font-bold uppercase">All</span>
              </Link>
              <Link
                href={`/admin/batches/${id}/commercial-invoice`}
                target="_blank"
                className="w-full py-2.5 text-xs font-bold text-slate-300 bg-slate-900 hover:bg-[#F15D38]/10 hover:text-[#F15D38] border border-slate-800 hover:border-[#F15D38]/30 rounded-xl transition-colors flex items-center justify-between px-4 gap-2"
              >
                <span>🧾 Commercial Invoice</span>
                <span className="text-[9px] text-slate-500 font-bold uppercase">All</span>
              </Link>
              {batch?.type === 'SEA' && (
                <Link
                  href={`/admin/batches/${id}/bill-of-lading`}
                  target="_blank"
                  className="w-full py-2.5 text-xs font-bold text-slate-300 bg-slate-900 hover:bg-[#F15D38]/10 hover:text-[#F15D38] border border-slate-800 hover:border-[#F15D38]/30 rounded-xl transition-colors flex items-center justify-between px-4 gap-2"
                >
                  <span>🚢 Bill of Lading</span>
                  <span className="text-[9px] text-blue-400 font-black uppercase">SEA</span>
                </Link>
              )}
              {batch?.type === 'AIR' && (
                <Link
                  href={`/admin/batches/${id}/airway-bill`}
                  target="_blank"
                  className="w-full py-2.5 text-xs font-bold text-slate-300 bg-slate-900 hover:bg-[#F15D38]/10 hover:text-[#F15D38] border border-slate-800 hover:border-[#F15D38]/30 rounded-xl transition-colors flex items-center justify-between px-4 gap-2"
                >
                  <span>✈️ Air Waybill (AWB)</span>
                  <span className="text-[9px] text-[#F15D38] font-black uppercase">AIR</span>
                </Link>
              )}
              <Link
                href={`/admin/batches/${id}/certificate-of-origin`}
                target="_blank"
                className="w-full py-2.5 text-xs font-bold text-slate-300 bg-slate-900 hover:bg-[#F15D38]/10 hover:text-[#F15D38] border border-slate-800 hover:border-[#F15D38]/30 rounded-xl transition-colors flex items-center justify-between px-4 gap-2"
              >
                <span>🌐 Certificate of Origin</span>
                <span className="text-[9px] text-slate-500 font-bold uppercase">All</span>
              </Link>
              <Link
                href={`/admin/batches/${id}/customs-declaration`}
                target="_blank"
                className="w-full py-2.5 text-xs font-bold text-slate-300 bg-slate-900 hover:bg-[#F15D38]/10 hover:text-[#F15D38] border border-slate-800 hover:border-[#F15D38]/30 rounded-xl transition-colors flex items-center justify-between px-4 gap-2"
              >
                <span>🛃 Customs Declaration</span>
                <span className="text-[9px] text-slate-500 font-bold uppercase">All</span>
              </Link>
            </div>
          </div>

          {/* Batch Expenses — real, saved into the Expenses section */}
          <div className="shipment-card">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-800/40">
              <div className="flex items-center gap-2">
                <DollarSign size={20} className="text-[#F15D38]" />
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Batch Expenses</h3>
              </div>
              <button
                onClick={() => setShowExpenseForm((v) => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-dashed border-slate-700 hover:border-[#F15D38] text-slate-400 hover:text-[#F15D38] rounded-xl text-[11px] font-bold transition-all"
              >
                <Plus size={13} /> {showExpenseForm ? 'Close' : 'Add'}
              </button>
            </div>

            {batchExpenses.length === 0 ? (
              <p className="text-[11px] text-slate-500 font-bold py-1">No expenses linked to this batch yet.</p>
            ) : (
              <div className="space-y-1 mb-2">
                {batchExpenses.map((exp) => (
                  <div key={exp._id} className="flex justify-between items-start gap-2 py-2 border-b border-slate-800/30 group/exp">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-200 truncate">{exp.vendor}</p>
                      <p className="text-[10px] text-slate-500 font-bold">
                        {exp.category}
                        <span className={`ml-1.5 ${exp.status === 'PAID' ? 'text-emerald-400' : exp.status === 'PARTIAL' ? 'text-blue-400' : 'text-amber-400'}`}>
                          · {exp.status}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-slate-100 text-sm">${(Number(exp.amount) || 0).toFixed(2)}</span>
                      <button
                        onClick={() => handleDeleteExpense(exp._id)}
                        className="p-1 text-slate-600 hover:text-rose-400 opacity-0 group-hover/exp:opacity-100 transition-all"
                        title="Delete expense"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total</span>
                  <span className="text-lg font-black text-[#F15D38]">${batchExpenseTotal.toFixed(2)}</span>
                </div>
              </div>
            )}

            {showExpenseForm && (
              <form onSubmit={handleAddExpense} className="space-y-2.5 mt-3 pt-3 border-t border-slate-800/40">
                <input
                  type="text"
                  value={expForm.vendor}
                  onChange={(e) => setExpForm({ ...expForm, vendor: e.target.value })}
                  placeholder="Who you paid (e.g. truck driver, loaders)"
                  className="search-input w-full !py-2 !text-xs"
                />
                <input
                  type="text"
                  list="batch-exp-cats"
                  value={expForm.category}
                  onChange={(e) => setExpForm({ ...expForm, category: e.target.value })}
                  placeholder="Category (pick or type)"
                  className="search-input w-full !py-2 !text-xs"
                />
                <datalist id="batch-exp-cats">
                  {BATCH_EXPENSE_CATEGORIES.map((c) => <option key={c} value={c} />)}
                </datalist>
                <div className="grid grid-cols-2 gap-2.5">
                  <input
                    type="number" min="0" step="0.01"
                    value={expForm.amount}
                    onChange={(e) => setExpForm({ ...expForm, amount: e.target.value })}
                    placeholder="Amount $"
                    className="search-input w-full !py-2 !text-xs"
                  />
                  <input
                    type="number" min="0" step="0.01"
                    value={expForm.amountPaid}
                    onChange={(e) => setExpForm({ ...expForm, amountPaid: e.target.value })}
                    placeholder="Paid $ (0 if none)"
                    className="search-input w-full !py-2 !text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <select
                    value={expForm.paymentMethod}
                    onChange={(e) => setExpForm({ ...expForm, paymentMethod: e.target.value })}
                    className="search-input w-full !py-2 !text-xs"
                  >
                    {EXPENSE_PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                  <input
                    type="date"
                    value={expForm.date}
                    onChange={(e) => setExpForm({ ...expForm, date: e.target.value })}
                    className="search-input w-full !py-2 !text-xs"
                  />
                </div>
                <input
                  type="text"
                  value={expForm.description}
                  onChange={(e) => setExpForm({ ...expForm, description: e.target.value })}
                  placeholder="Note (optional)"
                  className="search-input w-full !py-2 !text-xs"
                />
                <button
                  type="submit"
                  disabled={savingExpense}
                  className="w-full py-2.5 bg-[#F15D38] hover:bg-[#d64420] rounded-xl font-black text-white text-xs uppercase tracking-wider transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <Save size={14} /> {savingExpense ? 'Saving…' : 'Save Expense'}
                </button>
              </form>
            )}

            <p className="text-[10px] text-slate-500 mt-3 leading-relaxed">
              Saved straight into your <span className="text-slate-300 font-bold">Expenses</span> section — view, edit or delete them there like any expense.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="bg-[#131B2E] border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 text-emerald-400 mb-4">
              <CheckCircle2 size={20} />
              <h4 className="font-bold text-slate-200 text-sm">Quick Actions</h4>
            </div>
            <div className="space-y-2">
              <Link href="/admin/expenses/new" className="w-full py-2.5 text-xs font-bold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors flex items-center justify-center">
                💸 Log New Expense
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

interface AdminProductLine {
  product: string;
  qty: number;
  tracking: string;
  received: boolean;
  measuredWeight: number | null;
  measuredCbm: number | null;
  notes: { text: string; at: string }[];
}

// Build the per-product lines for a shipment — ONE line per product, the same rule
// the warehouse tracking link uses, so admin sees exactly what the keeper edits.
// items[] is the master list; if a product also has a tracking number it has a
// parallel courierPackages[] entry (goods === description) — pair them onto one line.
function buildProductLines(s: any): AdminProductLine[] {
  const num = (v: any): number | null => (typeof v === 'number' && !isNaN(v) ? v : null);
  const notes = (n: any) => (Array.isArray(n) ? n.map((x: any) => ({ text: x.text || '', at: x.at || '' })) : []);
  const mergeNotes = (a: any, b: any) => {
    const seen = new Set<string>();
    return [...notes(a), ...notes(b)]
      .filter((n) => { const k = `${n.text}|${n.at}`; if (seen.has(k)) return false; seen.add(k); return true; })
      .sort((x, y) => (x.at < y.at ? -1 : x.at > y.at ? 1 : 0));
  };

  const itemsArr: any[] = Array.isArray(s.items) ? s.items : [];
  const couriersArr: any[] = Array.isArray(s.courierPackages) ? s.courierPackages : [];
  const usedCp = new Set<number>();

  const itemLines: AdminProductLine[] = itemsArr.map((it: any) => {
    let cpIdx = -1;
    for (let i = 0; i < couriersArr.length; i++) {
      if (usedCp.has(i)) continue;
      if ((couriersArr[i].goods || '') === (it.description || '')) { cpIdx = i; break; }
    }
    const cp = cpIdx >= 0 ? couriersArr[cpIdx] : null;
    if (cpIdx >= 0) usedCp.add(cpIdx);
    return {
      product: it.description || '-',
      qty: it.qty || 1,
      tracking: cp ? cp.trackingNumber || '' : '',
      received: !!it.received || !!(cp && cp.received),
      measuredWeight: num(it.measuredWeight) ?? (cp ? num(cp.measuredWeight) : null),
      measuredCbm: num(it.measuredCbm) ?? (cp ? num(cp.measuredCbm) : null),
      notes: cp ? mergeNotes(it.warehouseNotes, cp.warehouseNotes) : notes(it.warehouseNotes),
    };
  });

  const courierLines: AdminProductLine[] = couriersArr
    .map((p: any, index: number) => ({ p, index }))
    .filter(({ index }) => !usedCp.has(index))
    .map(({ p }) => ({
      product: p.goods || p.courier || '-', qty: p.qty || 1, tracking: p.trackingNumber || '',
      received: !!p.received, measuredWeight: num(p.measuredWeight), measuredCbm: num(p.measuredCbm), notes: notes(p.warehouseNotes),
    }));

  return [...itemLines, ...courierLines];
}

function formatNoteDate(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

// Custom icons to avoid importing Plane / Ship from Lucide which may collide or differ
function PlaneIcon({ size = 16 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3.5c-.5-.5-2.5 0-4 1.5L13.5 8.5 5.3 6.7c-.9-.2-1.7.3-1.9 1.1-.2.8.2 1.6 1 1.9l8.6 3.1-4.7 4.7-3.6-.9c-.6-.2-1.2.1-1.5.6-.3.5-.2 1.2.2 1.6l2 2c.4.4 1 .5 1.5.2c.5-.3.8-.9.6-1.5l-.9-3.6 4.7-4.7 3.1 8.6c.3.8 1.1 1.2 1.9 1c.8-.2 1.3-1 1.1-1.9z"/>
    </svg>
  );
}

function ShipIcon({ size = 16 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 21h20"/>
      <path d="M19.3 14.8C21.1 13.5 22 11.7 22 10c0-3.9-3.1-7-7-7-3 0-5.6 1.9-6.6 4.5C7.2 7.1 6.1 7 5 7c-2.8 0-5 2.2-5 5 0 1.2.4 2.3 1.1 3.2L3 21h18l-1.7-6.2z"/>
      <path d="M14 3v4"/>
      <path d="M10 7v4"/>
    </svg>
  );
}
