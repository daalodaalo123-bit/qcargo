'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  Plus,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Send,
  Download,
  TrendingUp,
  Trash2,
  Calendar,
  DollarSign,
  Pencil,
  X,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import RecordPaymentModal, { type PaymentQuotation } from './RecordPaymentModal';
import EditQuotationModal, { type EditQuotationData } from './EditQuotationModal';
import QuotationPreviewModal from './QuotationPreviewModal';

interface Quotation {
  id: string;
  customer: string;
  phone?: string;
  goods: string;
  price: number;
  date: string;
  status: 'SENT' | 'DRAFT' | 'APPROVED' | 'REJECTED';
  paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID';
  amountPaid: number;
  type: 'AIR' | 'SEA';
  createdByName?: string;
}

// Demo fallback data removed — real quotations come only from the database.

export default function QuotationsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'AIR' | 'SEA'>('ALL');
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [paymentQuote, setPaymentQuote] = useState<PaymentQuotation | null>(null);
  const [editQuote, setEditQuote] = useState<EditQuotationData | null>(null);
  const [previewQuote, setPreviewQuote] = useState<string | null>(null);
  const [sendQuote, setSendQuote] = useState<Quotation | null>(null);
  const [sendPhone, setSendPhone] = useState('');
  const [sending, setSending] = useState(false);

  // Load quotations from MongoDB
  const loadQuotations = async () => {
    try {
      const res = await fetch('/api/quotations');
      if (!res.ok) throw new Error('Failed to load quotations');
      const data = await res.json();
      setQuotations(data.map((q: any) => ({
        id: q._id || q.id,
        customer: q.customer,
        phone: q.phone || '',
        goods: q.goods || (q.items && q.items.length > 0 ? `${q.items[0].qty}x ${q.items[0].description}` : 'Itemized Goods'),
        price: q.price || q.total || 0,
        date: q.date,
        status: q.status || 'SENT',
        paymentStatus: q.paymentStatus || 'UNPAID',
        amountPaid: q.amountPaid || 0,
        type: q.type || 'AIR',
        createdByName: q.createdBy?.name || ''
      })));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadQuotations();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this quotation?')) {
      try {
        const res = await fetch(`/api/quotations?id=${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete quotation');
        setQuotations(prev => prev.filter(q => q.id !== id));
        alert('Quotation deleted.');
      } catch (err: any) {
        alert(`Error: ${err.message}`);
      }
    }
  };

  const openSendDialog = (quote: Quotation) => {
    setSendQuote(quote);
    setSendPhone(quote.phone || '');
  };

  const handleSendToCustomer = async () => {
    if (!sendQuote) return;
    if (!sendPhone.trim()) {
      alert('Please enter a phone number.');
      return;
    }
    setSending(true);
    try {
      const res = await fetch(`/api/quotations/${sendQuote.id}/send-whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: sendPhone.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        const msg = data.pdfSent ? 'PDF quotation sent via WhatsApp!' : 'Quotation sent via WhatsApp (text + PDF link).';
        alert(`${msg}`);
        if (sendPhone.trim() !== sendQuote.phone) {
          await fetch(`/api/quotations/${sendQuote.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customer: sendQuote.customer, phone: sendPhone.trim() }),
          });
          loadQuotations();
        }
        setSendQuote(null);
      } else {
        alert(`Error: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      alert(`Failed to send: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Customer,Goods,Estimate,Date,Status,Type"].join(",") + "\n"
      + quotations.map(q => `"${q.customer}","${q.goods}",${q.price},"${q.date}","${q.status}","${q.type}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "qcargo_quotations_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter based on search + type
  const filteredQuotations = quotations.filter(q =>
    (typeFilter === 'ALL' || q.type === typeFilter) &&
    (q.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.goods.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.status.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Stats calculation
  const totalValue = quotations.reduce((acc, q) => acc + q.price, 0);
  const activeQuotesCount = quotations.filter(q => q.status === 'SENT' || q.status === 'DRAFT').length;
  const pendingReplyCount = quotations.filter(q => q.status === 'SENT').length;
  const conversionRate = quotations.length > 0 
    ? Math.round((quotations.filter(q => q.status === 'APPROVED').length / quotations.length) * 100)
    : 0;

  return (
    <div className="admin-container">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight">Quotations & Offers</h1>
          <p className="text-slate-400 font-medium">Professional proposals and pricing management</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={handleExport}
            className="flex-1 md:flex-none btn bg-white border border-slate-800 text-slate-300 flex items-center justify-center gap-2 hover:bg-slate-800 shadow-sm"
          >
            <Download size={18} />
            Export Data
          </button>
          <Link href="/admin/quotations/new" className="flex-1 md:flex-none btn btn-primary flex items-center justify-center gap-2 shadow-lg shadow-[#F15D38]/20">
            <Plus size={18} />
            New Quotation
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="shipment-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-xl bg-[#F15D38]/10 text-[#F15D38]">
              <FileText size={20} />
            </div>
            <span className="text-xs font-bold text-[#F15D38] bg-[#F15D38]/10 px-2 py-0.5 rounded-lg">Active</span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Open Quotes</p>
          <h3 className="text-2xl font-black text-slate-100">{activeQuotesCount}</h3>
        </div>
        <div className="shipment-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-xl bg-emerald-950/30 text-emerald-400 border border-emerald-800/20">
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Conversion</p>
          <h3 className="text-2xl font-black text-slate-100">{conversionRate}%</h3>
        </div>
        <div className="shipment-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-xl bg-amber-950/30 text-amber-400 border border-amber-800/20">
              <Clock size={20} />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Reply</p>
          <h3 className="text-2xl font-black text-slate-100">{pendingReplyCount}</h3>
        </div>
        <div className="shipment-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-xl bg-slate-900 text-slate-400 border border-slate-800">
              <Calendar size={20} />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Value</p>
          <h3 className="text-2xl font-black text-slate-100">${totalValue.toLocaleString()}</h3>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-3 mb-8">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#F15D38] transition-colors" size={20} />
            <input
              type="text"
              placeholder="Search by customer, goods, status..."
              className="search-input !pl-12 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2">
          {(['ALL', 'AIR', 'SEA'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                typeFilter === t
                  ? t === 'AIR' ? 'bg-[#F15D38] text-white border-[#F15D38] shadow-md shadow-[#F15D38]/20'
                    : t === 'SEA' ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-900/30'
                    : 'bg-slate-700 text-white border-slate-600'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600 hover:text-slate-200'
              }`}
            >
              {t === 'ALL' ? 'All Types' : t === 'AIR' ? '✈ Air Freight' : '🚢 Sea Freight'}
              {t !== 'ALL' && (
                <span className="ml-1.5 opacity-70">({quotations.filter(q => q.type === t).length})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Quotations Table */}
      <div className="shipment-card !p-0 overflow-hidden border border-slate-800 shadow-xl shadow-slate-950/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/40 border-b border-slate-800">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Customer / Date</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Items & Freight</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Estimate</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredQuotations.map((quote) => (
                <tr
                  key={quote.id}
                  onClick={() => setPreviewQuote(quote.id)}
                  className="hover:bg-slate-800/30 transition-all group cursor-pointer"
                >
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-100">{quote.customer}</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase mt-0.5 tracking-wider">{quote.date}</span>
                      {quote.createdByName && (
                        <span className="text-[9px] font-black text-slate-400 bg-slate-800/60 border border-slate-700 w-fit px-1.5 py-0.5 rounded mt-1">
                          By {quote.createdByName}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-300">{quote.goods}</span>
                      <span className="text-[9px] font-black text-[#F15D38] bg-[#F15D38]/10 w-fit px-1.5 py-0.5 rounded mt-1">
                        VIA {quote.type} FREIGHT
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1.5">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-full w-fit ${
                        quote.status === 'APPROVED' ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-800/20' : 
                        quote.status === 'SENT' ? 'bg-[#F15D38]/15 text-[#F15D38] border border-[#F15D38]/20' : 
                        quote.status === 'REJECTED' ? 'bg-rose-950/30 text-rose-400 border border-rose-800/20' : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          quote.status === 'APPROVED' ? 'bg-emerald-500' : 
                          quote.status === 'SENT' ? 'bg-[#F15D38]' : 
                          quote.status === 'REJECTED' ? 'bg-rose-500' : 'bg-slate-400'
                        }`} />
                        {quote.status}
                      </span>
                      {quote.paymentStatus !== 'UNPAID' && (
                        <span className={`inline-flex items-center gap-1.5 text-[9px] font-black px-2 py-0.5 rounded-full w-fit ${
                          quote.paymentStatus === 'PAID'
                            ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-700/30'
                            : 'bg-amber-950/40 text-amber-300 border border-amber-700/30'
                        }`}>
                          {quote.paymentStatus === 'PAID' ? 'PAID FULL' : `PARTIAL · $${quote.amountPaid}`}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <span className="font-black text-slate-100 text-lg">${quote.price.toLocaleString()}</span>
                    {quote.paymentStatus === 'PARTIAL' && (
                      <p className="text-[10px] font-bold text-amber-400 mt-0.5">
                        ${Math.max(0, quote.price - quote.amountPaid).toFixed(2)} due
                      </p>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center justify-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                    >
                      <button
                        onClick={() => setPreviewQuote(quote.id)}
                        className="p-2 hover:bg-slate-800 text-slate-400 hover:text-slate-100 rounded-lg transition-colors"
                        title="Preview Quotation"
                      >
                        <Eye size={16} />
                      </button>
                      {quote.paymentStatus !== 'PAID' && quote.status !== 'REJECTED' && (
                        <button
                          onClick={() => setPaymentQuote({
                            id: quote.id,
                            customer: quote.customer,
                            phone: quote.phone,
                            goods: quote.goods,
                            price: quote.price,
                            date: quote.date,
                            type: quote.type,
                            amountPaid: quote.amountPaid,
                            paymentStatus: quote.paymentStatus,
                          })}
                          className="p-2 hover:bg-emerald-950/30 text-slate-400 hover:text-emerald-400 rounded-lg transition-colors"
                          title={quote.paymentStatus === 'PARTIAL' ? 'Record another payment' : 'Record payment & send receipt'}
                        >
                          <DollarSign size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => setEditQuote({
                          id: quote.id,
                          customer: quote.customer,
                          phone: quote.phone,
                          goods: quote.goods,
                          price: quote.price,
                          type: quote.type,
                          status: quote.status,
                        })}
                        className="p-2 hover:bg-slate-800 text-slate-400 hover:text-slate-100 rounded-lg transition-colors"
                        title="Edit Quotation"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => openSendDialog(quote)}
                        className="p-2 hover:bg-[#F15D38]/10 text-slate-400 hover:text-[#F15D38] rounded-lg transition-colors"
                        title="Send WhatsApp"
                      >
                        <Send size={16} />
                      </button>
                      <a
                        href={`/api/quotations/${quote.id}/pdf`}
                        download
                        className="p-2 hover:bg-slate-800 text-slate-400 hover:text-slate-100 rounded-lg transition-colors inline-flex"
                        title="Download PDF"
                      >
                        <Download size={16} />
                      </a>
                      <button 
                        onClick={() => handleDelete(quote.id)}
                        className="p-2 hover:bg-rose-950/30 text-slate-400 hover:text-rose-500 rounded-lg transition-colors" 
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <RecordPaymentModal
        quote={paymentQuote}
        onClose={() => setPaymentQuote(null)}
        onSuccess={loadQuotations}
      />

      <EditQuotationModal
        quotation={editQuote}
        onClose={() => setEditQuote(null)}
        onSuccess={loadQuotations}
      />

      <QuotationPreviewModal
        quotationId={previewQuote}
        onClose={() => setPreviewQuote(null)}
      />

      {sendQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setSendQuote(null)}>
          <div className="w-full max-w-sm bg-[#131B2E] border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-100 uppercase tracking-wider">Send WhatsApp</h2>
              <button onClick={() => setSendQuote(null)} className="p-1 text-slate-400 hover:text-slate-200"><X size={16} /></button>
            </div>
            <p className="text-xs text-slate-400">Sending quotation for <span className="text-slate-200 font-bold">{sendQuote.customer}</span></p>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">WhatsApp Number</label>
              <input
                type="text"
                className="search-input w-full"
                placeholder="+252 63 ..."
                value={sendPhone}
                onChange={e => setSendPhone(e.target.value)}
                autoFocus
              />
              <p className="text-[10px] text-slate-500 mt-1">Edit if the number above is wrong</p>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setSendQuote(null)} className="flex-1 py-2.5 text-slate-400 text-xs font-bold uppercase">Cancel</button>
              <button
                onClick={handleSendToCustomer}
                disabled={sending}
                className="flex-1 py-2.5 bg-[#F15D38] hover:bg-[#d64420] disabled:opacity-60 text-white rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2"
              >
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
