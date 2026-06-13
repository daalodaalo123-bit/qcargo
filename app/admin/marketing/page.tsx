'use client';

import { useState, useEffect } from 'react';
import {
  Megaphone,
  MessageSquare,
  FileText,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Plus,
  Trash2,
  Loader2,
} from 'lucide-react';

interface LeadMetric {
  id: string;
  date: string;
  messages: number;
  quotesSent: number;
  ordersConfirmed: number;
}

export default function MarketingPage() {
  const [metrics, setMetrics] = useState<LeadMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState('');
  const [adding, setAdding] = useState(false);

  const loadMetrics = async () => {
    try {
      const res = await fetch('/api/marketing/leads');
      if (!res.ok) throw new Error('Failed to load lead metrics');
      const data = await res.json();
      setMetrics(data.map((m: any) => ({
        id: String(m._id),
        date: String(m.date),
        messages: Number(m.messages) || 0,
        quotesSent: Number(m.quotesSent) || 0,
        ordersConfirmed: Number(m.ordersConfirmed) || 0,
      })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  const handleFieldChange = (id: string, field: 'messages' | 'quotesSent' | 'ordersConfirmed', value: string) => {
    const num = value === '' ? 0 : parseInt(value, 10);
    setMetrics(prev => prev.map(m => m.id === id ? { ...m, [field]: isNaN(num) ? 0 : num } : m));
  };

  const handleFieldSave = async (metric: LeadMetric) => {
    setSavingId(metric.id);
    try {
      const res = await fetch(`/api/marketing/leads?id=${metric.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: metric.messages,
          quotesSent: metric.quotesSent,
          ordersConfirmed: metric.ordersConfirmed,
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this day\'s lead data?')) return;
    try {
      const res = await fetch(`/api/marketing/leads?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setMetrics(prev => prev.filter(m => m.id !== id));
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleAddDay = async () => {
    if (!newDate) {
      alert('Please select a date');
      return;
    }
    if (metrics.some(m => m.date === newDate)) {
      alert('An entry for this date already exists. Edit it directly in the table.');
      return;
    }
    setAdding(true);
    try {
      const res = await fetch('/api/marketing/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: newDate, messages: 0, quotesSent: 0, ordersConfirmed: 0 }),
      });
      if (!res.ok) throw new Error('Failed to add day');
      const created = await res.json();
      setMetrics(prev => [...prev, {
        id: String(created._id),
        date: String(created.date),
        messages: 0,
        quotesSent: 0,
        ordersConfirmed: 0,
      }].sort((a, b) => a.date.localeCompare(b.date)));
      setNewDate('');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setAdding(false);
    }
  };

  // Totals & funnel rates
  const totals = metrics.reduce((acc, m) => ({
    messages: acc.messages + m.messages,
    quotesSent: acc.quotesSent + m.quotesSent,
    ordersConfirmed: acc.ordersConfirmed + m.ordersConfirmed,
  }), { messages: 0, quotesSent: 0, ordersConfirmed: 0 });

  const quoteRate = totals.messages > 0 ? (totals.quotesSent / totals.messages) * 100 : 0;
  const closeRate = totals.quotesSent > 0 ? (totals.ordersConfirmed / totals.quotesSent) * 100 : 0;
  const overallConversion = totals.messages > 0 ? (totals.ordersConfirmed / totals.messages) * 100 : 0;
  const droppedAtQuote = totals.messages - totals.quotesSent;
  const droppedAtOrder = totals.quotesSent - totals.ordersConfirmed;

  return (
    <div className="admin-container">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight">Marketing</h1>
          <p className="text-slate-400 font-medium">Track new lead activity and where customers drop off in the sales funnel</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="shipment-card !bg-slate-900 border border-slate-800 text-white">
          <p className="text-[10px] font-bold opacity-50 uppercase tracking-[0.2em] mb-1">Total Messages</p>
          <h3 className="text-3xl font-black text-slate-100">{totals.messages}</h3>
          <div className="mt-4 flex items-center gap-2 text-[#F15D38] text-xs font-bold">
            <MessageSquare size={14} />
            New conversations started
          </div>
        </div>
        <div className="shipment-card">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Quotes Sent</p>
          <h3 className="text-3xl font-black text-slate-100">{totals.quotesSent}</h3>
          <div className="mt-4 flex items-center gap-2 text-blue-400 text-xs font-bold">
            <TrendingUp size={14} />
            {quoteRate.toFixed(0)}% of messages quoted
          </div>
        </div>
        <div className="shipment-card">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Orders Confirmed</p>
          <h3 className="text-3xl font-black text-slate-100">{totals.ordersConfirmed}</h3>
          <div className="mt-4 flex items-center gap-2 text-emerald-400 text-xs font-bold">
            <ShoppingCart size={14} />
            {closeRate.toFixed(0)}% of quotes closed
          </div>
        </div>
        <div className="shipment-card">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Overall Conversion</p>
          <h3 className="text-3xl font-black text-slate-100">{overallConversion.toFixed(1)}%</h3>
          <div className="mt-4 flex items-center gap-2 text-amber-400 text-xs font-bold">
            <Megaphone size={14} />
            Messages to confirmed orders
          </div>
        </div>
      </div>

      {/* Drop-off insight */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="shipment-card border border-rose-800/20 bg-rose-950/10">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={16} className="text-rose-400" />
            <p className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em]">Drop-off: Messaged but no Quote</p>
          </div>
          <h3 className="text-2xl font-black text-slate-100">{droppedAtQuote} leads</h3>
          <p className="text-xs text-slate-500 mt-1">Customers who messaged but never received/responded to a quote.</p>
        </div>
        <div className="shipment-card border border-amber-800/20 bg-amber-950/10">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={16} className="text-amber-400" />
            <p className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em]">Drop-off: Quoted but no Order</p>
          </div>
          <h3 className="text-2xl font-black text-slate-100">{droppedAtOrder} leads</h3>
          <p className="text-xs text-slate-500 mt-1">Customers who got a quote but did not confirm an order.</p>
        </div>
      </div>

      {/* Leads Table */}
      <div className="shipment-card !p-0 overflow-hidden border border-slate-800 shadow-xl shadow-slate-950/20">
        <div className="px-8 py-5 border-b border-slate-800">
          <h2 className="text-sm font-black text-slate-100 uppercase tracking-wider">Start Tracking New Leads</h2>
          <p className="text-xs text-slate-500 mt-1">Daily funnel: Messages → Quotes Sent → Orders Confirmed</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/40 border-b border-slate-800">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Messages</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Quotes Sent</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Orders Confirmed</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Quote Rate</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Close Rate</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-8 py-10 text-center">
                    <Loader2 size={20} className="animate-spin text-[#F15D38] mx-auto" />
                  </td>
                </tr>
              ) : metrics.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-10 text-center text-xs font-bold text-slate-500">No lead data yet. Add a day below to get started.</td>
                </tr>
              ) : (
                metrics.map((m) => {
                  const rowQuoteRate = m.messages > 0 ? (m.quotesSent / m.messages) * 100 : 0;
                  const rowCloseRate = m.quotesSent > 0 ? (m.ordersConfirmed / m.quotesSent) * 100 : 0;
                  return (
                    <tr key={m.id} className="hover:bg-slate-800/30 transition-all group">
                      <td className="px-8 py-4">
                        <span className="font-bold text-slate-100">{m.date}</span>
                      </td>
                      <td className="px-8 py-4 text-center">
                        <input
                          type="number"
                          min={0}
                          value={m.messages}
                          onChange={(e) => handleFieldChange(m.id, 'messages', e.target.value)}
                          onBlur={() => handleFieldSave(m)}
                          className="w-20 text-center bg-slate-900 border border-slate-800 rounded-lg py-1.5 text-sm font-bold text-slate-100 focus:outline-none focus:border-[#F15D38]"
                        />
                      </td>
                      <td className="px-8 py-4 text-center">
                        <input
                          type="number"
                          min={0}
                          value={m.quotesSent}
                          onChange={(e) => handleFieldChange(m.id, 'quotesSent', e.target.value)}
                          onBlur={() => handleFieldSave(m)}
                          className="w-20 text-center bg-slate-900 border border-slate-800 rounded-lg py-1.5 text-sm font-bold text-slate-100 focus:outline-none focus:border-[#F15D38]"
                        />
                      </td>
                      <td className="px-8 py-4 text-center">
                        <input
                          type="number"
                          min={0}
                          value={m.ordersConfirmed}
                          onChange={(e) => handleFieldChange(m.id, 'ordersConfirmed', e.target.value)}
                          onBlur={() => handleFieldSave(m)}
                          className="w-20 text-center bg-slate-900 border border-slate-800 rounded-lg py-1.5 text-sm font-bold text-slate-100 focus:outline-none focus:border-[#F15D38]"
                        />
                      </td>
                      <td className="px-8 py-4 text-center">
                        <span className="inline-flex items-center text-xs font-black px-3 py-1 rounded-full bg-blue-950/30 text-blue-400 border border-blue-800/20">
                          {rowQuoteRate.toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-8 py-4 text-center">
                        <span className="inline-flex items-center text-xs font-black px-3 py-1 rounded-full bg-emerald-950/30 text-emerald-400 border border-emerald-800/20">
                          {rowCloseRate.toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-8 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {savingId === m.id && <Loader2 size={14} className="animate-spin text-slate-500" />}
                          <button
                            onClick={() => handleDelete(m.id)}
                            className="p-2 hover:bg-rose-950/30 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Add new day */}
        <div className="px-8 py-5 border-t border-slate-800 flex flex-wrap items-center gap-3">
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-sm font-bold text-slate-100 focus:outline-none focus:border-[#F15D38]"
          />
          <button
            onClick={handleAddDay}
            disabled={adding}
            className="btn btn-primary flex items-center gap-2 shadow-lg shadow-[#F15D38]/20 disabled:opacity-50"
          >
            {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Add Day
          </button>
        </div>
      </div>
    </div>
  );
}
