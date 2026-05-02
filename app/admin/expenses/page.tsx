'use client';

import { useState } from 'react';
import { 
  CreditCard, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  ArrowUpRight, 
  ArrowDownRight,
  DollarSign,
  Calendar,
  Tag,
  ChevronRight,
  Download,
  Trash2,
  Pencil
} from 'lucide-react';
import Link from 'next/link';

export default function ExpensesPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const expenses = [
    { id: 'EXP-001', batchId: 'DUR-2024-001', category: 'Customs', vendor: 'Hargeisa Port Authority', amount: 1250.00, date: '2024-05-15', status: 'PAID' },
    { id: 'EXP-002', batchId: 'DUR-2024-002', category: 'Trucking', vendor: 'Local Transport Co', amount: 450.00, date: '2024-05-16', status: 'PAID' },
    { id: 'EXP-003', batchId: 'DUR-2024-001', category: 'Warehousing', vendor: 'Durdur GZ Warehouse', amount: 800.00, date: '2024-05-18', status: 'PENDING' },
    { id: 'EXP-004', batchId: 'DUR-2024-003', category: 'Sourcing', vendor: 'Agent Lee', amount: 300.00, date: '2024-05-20', status: 'PAID' },
  ];

  return (
    <div className="admin-container">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Expense Ledger</h1>
          <p className="text-slate-500 font-medium">Track operational costs and overhead expenditures</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none btn bg-white border border-slate-200 text-slate-600 flex items-center justify-center gap-2 hover:bg-slate-50 shadow-sm">
            <Download size={18} />
            Export CSV
          </button>
          <Link href="/admin/expenses/new" className="flex-1 md:flex-none btn btn-primary flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20">
            <Plus size={18} />
            Record Expense
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="shipment-card !bg-slate-900 text-white">
          <p className="text-[10px] font-bold opacity-50 uppercase tracking-[0.2em] mb-1">Total Expenses (MTD)</p>
          <h3 className="text-3xl font-black">$2,800.00</h3>
          <div className="mt-4 flex items-center gap-2 text-rose-400 text-xs font-bold">
            <ArrowUpRight size={14} />
            12% increase from last month
          </div>
        </div>
        <div className="shipment-card">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Pending Invoices</p>
          <h3 className="text-3xl font-black text-slate-900">$800.00</h3>
          <div className="mt-4 flex items-center gap-2 text-amber-500 text-xs font-bold">
            <Calendar size={14} />
            Next payment due in 3 days
          </div>
        </div>
        <div className="shipment-card">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Top Category</p>
          <h3 className="text-3xl font-black text-slate-900">Customs</h3>
          <div className="mt-4 flex items-center gap-2 text-blue-600 text-xs font-bold">
            <Tag size={14} />
            45% of total spend
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search by Vendor, Batch, or ID..." 
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

      {/* Expenses Table */}
      <div className="shipment-card !p-0 overflow-hidden border-none shadow-xl shadow-slate-200/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Transaction</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Category</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Batch ID</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Amount</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50/30 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">{exp.vendor}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-wider">{exp.id} • {exp.date}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                      <Tag size={12} className="text-slate-400" />
                      {exp.category}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {exp.batchId}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-full ${
                      exp.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${exp.status === 'PAID' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {exp.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <span className="font-black text-slate-900">${exp.amount.toLocaleString()}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors" title="Edit Expense">
                        <Pencil size={16} />
                      </button>
                      <button className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors" title="Delete Expense">
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
