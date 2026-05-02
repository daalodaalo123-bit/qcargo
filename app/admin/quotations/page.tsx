'use client';

import { useState } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Plus, 
  ChevronRight,
  MoreVertical,
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

export default function QuotationsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const quotations = [
    { id: '1', customer: 'Hassan Ahmed', goods: '50 Cartons Electronics', price: 1450.00, date: '2024-05-18', status: 'SENT', type: 'AIR' },
    { id: '2', customer: 'Sahra Ismail', goods: '20 Sets Kitchenware', price: 850.00, date: '2024-05-17', status: 'DRAFT', type: 'SEA' },
    { id: '3', customer: 'Abdi Dahir', goods: 'Textile Rolls (China)', price: 3200.00, date: '2024-05-15', status: 'ACCEPTED', type: 'SEA' },
    { id: '4', customer: 'Mustafe Mohamed', goods: 'Spare Parts - Batch 09', price: 650.00, date: '2024-05-14', status: 'EXPIRED', type: 'AIR' },
  ];

  return (
    <div className="admin-container">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Quotations & Offers</h1>
          <p className="text-slate-500 font-medium">Professional proposals and pricing management</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none btn bg-white border border-slate-200 text-slate-600 flex items-center justify-center gap-2 hover:bg-slate-50 shadow-sm">
            <Download size={18} />
            Export Data
          </button>
          <Link href="/admin/quotations/new" className="flex-1 md:flex-none btn btn-primary flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20">
            <Plus size={18} />
            New Quotation
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="shipment-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <FileText size={20} />
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">Active</span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Open Quotes</p>
          <h3 className="text-2xl font-black text-slate-900">42</h3>
        </div>
        <div className="shipment-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Conversion</p>
          <h3 className="text-2xl font-black text-slate-900">74%</h3>
        </div>
        <div className="shipment-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock size={20} />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Reply</p>
          <h3 className="text-2xl font-black text-slate-900">12</h3>
        </div>
        <div className="shipment-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-xl bg-slate-50 text-slate-400">
              <Calendar size={20} />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Value</p>
          <h3 className="text-2xl font-black text-slate-900">$84k</h3>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search by Customer or Items..." 
            className="search-input !pl-12 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn bg-white border border-slate-200 text-slate-600 flex items-center gap-2 hover:bg-slate-50 px-6">
          <Filter size={18} />
          Filters
        </button>
      </div>

      {/* Quotations Table */}
      <div className="shipment-card !p-0 overflow-hidden border-none shadow-xl shadow-slate-200/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Customer / Date</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Items & Freight</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Estimate</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {quotations.map((quote) => (
                <tr key={quote.id} className="hover:bg-slate-50/30 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">{quote.customer}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-wider">{quote.date}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-600">{quote.goods}</span>
                      <span className="text-[9px] font-black text-blue-600 bg-blue-50 w-fit px-1.5 py-0.5 rounded mt-1">
                        VIA {quote.type} FREIGHT
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-full ${
                      quote.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-600' : 
                      quote.status === 'SENT' ? 'bg-blue-50 text-blue-600' : 
                      quote.status === 'EXPIRED' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        quote.status === 'ACCEPTED' ? 'bg-emerald-500' : 
                        quote.status === 'SENT' ? 'bg-blue-500' : 
                        quote.status === 'EXPIRED' ? 'bg-rose-500' : 'bg-slate-400'
                      }`} />
                      {quote.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <span className="font-black text-slate-900 text-lg">${quote.price.toLocaleString()}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors" title="Send to Customer">
                        <Send size={16} />
                      </button>
                      <button className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-900 rounded-lg transition-colors" title="Download PDF">
                        <Download size={16} />
                      </button>
                      <button className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors" title="Delete">
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
