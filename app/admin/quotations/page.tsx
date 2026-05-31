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
  Pencil,
  Trash2,
  Calendar
} from 'lucide-react';
import Link from 'next/link';

interface Quotation {
  id: string;
  customer: string;
  phone?: string;
  goods: string;
  price: number;
  date: string;
  status: 'SENT' | 'DRAFT' | 'ACCEPTED' | 'EXPIRED';
  type: 'AIR' | 'SEA';
}

const DEFAULT_QUOTATIONS: Quotation[] = [
  { id: 'q1', customer: 'Hassan Ahmed', phone: '+252 63 777 8986', goods: '50 Cartons Electronics', price: 1450.00, date: '2026-05-30', status: 'SENT', type: 'AIR' },
  { id: 'q2', customer: 'Sahra Ismail', phone: '+252 63 444 2211', goods: '20 Sets Kitchenware', price: 850.00, date: '2026-05-29', status: 'DRAFT', type: 'SEA' },
  { id: 'q3', customer: 'Abdi Dahir', phone: '+252 61 555 1234', goods: 'Textile Rolls (China)', price: 3200.00, date: '2026-05-28', status: 'ACCEPTED', type: 'SEA' },
  { id: 'q4', customer: 'Mustafe Mohamed', phone: '+252 63 777 8986', goods: 'Spare Parts - Batch 09', price: 650.00, date: '2026-05-27', status: 'EXPIRED', type: 'AIR' },
];

export default function QuotationsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [quotations, setQuotations] = useState<Quotation[]>([]);

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
        type: q.type || 'AIR'
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

  const handleSendToCustomer = async (quote: Quotation) => {
    if (!quote.phone) {
      alert(`No phone number for ${quote.customer}. Please add a phone number.`);
      return;
    }
    const message = `Asc ${quote.customer}, Durdur Cargo quotation:\nGoods: ${quote.goods}\nEstimate: $${quote.price}\nFreight: ${quote.type} Cargo\nContact us to confirm your order.`;
    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: quote.phone, message }),
      });
      const data = await res.json();
      if (data.success) alert(`WhatsApp sent to ${quote.customer}!`);
      else alert(`Error sending: ${data.message || 'Unknown error'}`);
    } catch (err: any) {
      alert(`Failed to send WhatsApp: ${err.message}`);
    }
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Customer,Goods,Estimate,Date,Status,Type"].join(",") + "\n"
      + quotations.map(q => `"${q.customer}","${q.goods}",${q.price},"${q.date}","${q.status}","${q.type}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "durdur_quotations_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter based on search
  const filteredQuotations = quotations.filter(q => 
    q.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.goods.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats calculation
  const totalValue = quotations.reduce((acc, q) => acc + q.price, 0);
  const activeQuotesCount = quotations.filter(q => q.status === 'SENT' || q.status === 'DRAFT').length;
  const pendingReplyCount = quotations.filter(q => q.status === 'SENT').length;
  const conversionRate = quotations.length > 0 
    ? Math.round((quotations.filter(q => q.status === 'ACCEPTED').length / quotations.length) * 100)
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
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#F15D38] transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search by Customer or Items..." 
            className="search-input !pl-12 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn bg-white border border-slate-800 text-slate-300 flex items-center gap-2 hover:bg-slate-800 px-6">
          <Filter size={18} />
          Filters
        </button>
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
                <tr key={quote.id} className="hover:bg-slate-800/30 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-100">{quote.customer}</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase mt-0.5 tracking-wider">{quote.date}</span>
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
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-full ${
                      quote.status === 'ACCEPTED' ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-800/20' : 
                      quote.status === 'SENT' ? 'bg-[#F15D38]/15 text-[#F15D38] border border-[#F15D38]/20' : 
                      quote.status === 'EXPIRED' ? 'bg-rose-950/30 text-rose-400 border border-rose-800/20' : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        quote.status === 'ACCEPTED' ? 'bg-emerald-500' : 
                        quote.status === 'SENT' ? 'bg-[#F15D38]' : 
                        quote.status === 'EXPIRED' ? 'bg-rose-500' : 'bg-slate-400'
                      }`} />
                      {quote.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <span className="font-black text-slate-100 text-lg">${quote.price.toLocaleString()}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleSendToCustomer(quote)}
                        className="p-2 hover:bg-[#F15D38]/10 text-slate-400 hover:text-[#F15D38] rounded-lg transition-colors" 
                        title="Send WhatsApp Alert"
                      >
                        <Send size={16} />
                      </button>
                      <button className="p-2 hover:bg-slate-800 text-slate-400 hover:text-slate-100 rounded-lg transition-colors" title="Download PDF">
                        <Download size={16} />
                      </button>
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
    </div>
  );
}
