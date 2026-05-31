'use client';

import { useState, useEffect } from 'react';
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

interface Expense {
  id: string;
  batchId: string;
  category: string;
  vendor: string;
  amount: number;
  date: string;
  status: 'PAID' | 'PENDING';
}

const DEFAULT_EXPENSES: Expense[] = [
  { id: 'EXP-001', batchId: 'FLT-2024-001', category: 'Customs', vendor: 'Hargeisa Port Authority', amount: 1250.00, date: '2026-05-15', status: 'PAID' },
  { id: 'EXP-002', batchId: 'CTN-2024-042', category: 'Trucking', vendor: 'Berbera local Transport Co', amount: 450.00, date: '2026-05-16', status: 'PAID' },
  { id: 'EXP-003', batchId: 'FLT-2024-001', category: 'Warehousing', vendor: 'Durdur Cargo GZ Warehouse', amount: 800.00, date: '2026-05-18', status: 'PENDING' },
  { id: 'EXP-004', batchId: 'FLT-2024-002', category: 'Sourcing', vendor: 'Agent Lee Sourcing', amount: 300.00, date: '2026-05-20', status: 'PAID' },
];

export default function ExpensesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Load expenses from MongoDB (stored as VendorBills)
  const loadExpenses = async () => {
    try {
      const res = await fetch('/api/bills');
      if (!res.ok) throw new Error('Failed to load expenses');
      const data = await res.json();
      setExpenses(data.map((b: any) => ({
        id: b._id || b.id,
        batchId: 'GENERAL',
        category: b.category || 'General',
        vendor: b.vendor,
        amount: b.amount,
        date: b.date,
        status: b.status === 'PAID' ? 'PAID' : 'PENDING'
      })));
    } catch (e) {
      console.error(e);
      setExpenses(DEFAULT_EXPENSES);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this expense record?')) {
      try {
        const res = await fetch(`/api/bills?id=${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete expense');
        setExpenses(prev => prev.filter(e => e.id !== id));
        alert('Expense deleted.');
      } catch (err: any) {
        alert(`Error: ${err.message}`);
      }
    }
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Expense ID,Batch ID,Category,Vendor,Amount,Date,Status"].join(",") + "\n"
      + expenses.map(e => `"${e.id}","${e.batchId}","${e.category}","${e.vendor}",${e.amount},"${e.date}","${e.status}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "durdur_expenses_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter based on search
  const filteredExpenses = expenses.filter(exp => 
    exp.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exp.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exp.batchId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculations
  const totalSpend = expenses.reduce((acc, e) => acc + e.amount, 0);
  const pendingSpend = expenses.filter(e => e.status === 'PENDING').reduce((acc, e) => acc + e.amount, 0);
  const topCategory = expenses.length > 0 
    ? expenses.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount;
        return acc;
      }, {} as Record<string, number>)
    : {};
  const sortedCategories = Object.entries(topCategory).sort((a, b) => b[1] - a[1]);
  const mainCategory = sortedCategories[0]?.[0] || 'None';

  return (
    <div className="admin-container">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight">Expense Ledger</h1>
          <p className="text-slate-400 font-medium">Track operational costs and overhead expenditures</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={handleExport}
            className="flex-1 md:flex-none btn bg-white border border-slate-800 text-slate-300 flex items-center justify-center gap-2 hover:bg-slate-800 shadow-sm"
          >
            <Download size={18} />
            Export CSV
          </button>
          <Link href="/admin/expenses/new" className="flex-1 md:flex-none btn btn-primary flex items-center justify-center gap-2 shadow-lg shadow-[#F15D38]/20">
            <Plus size={18} />
            Record Expense
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="shipment-card !bg-slate-900 border border-slate-800 text-white">
          <p className="text-[10px] font-bold opacity-50 uppercase tracking-[0.2em] mb-1">Total Expenses (MTD)</p>
          <h3 className="text-3xl font-black text-slate-100">${totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
          <div className="mt-4 flex items-center gap-2 text-[#F15D38] text-xs font-bold">
            <ArrowUpRight size={14} />
            Operations ledger reconciled
          </div>
        </div>
        <div className="shipment-card">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Pending Payables</p>
          <h3 className="text-3xl font-black text-slate-100">${pendingSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
          <div className="mt-4 flex items-center gap-2 text-amber-400 text-xs font-bold">
            <Calendar size={14} />
            Awaiting commission balancing
          </div>
        </div>
        <div className="shipment-card">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Top Category</p>
          <h3 className="text-3xl font-black text-slate-100">{mainCategory}</h3>
          <div className="mt-4 flex items-center gap-2 text-[#F15D38] text-xs font-bold">
            <Tag size={14} />
            Primary operational expense
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#F15D38] transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search by Vendor, Category, or Batch..." 
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

      {/* Expenses Table */}
      <div className="shipment-card !p-0 overflow-hidden border border-slate-800 shadow-xl shadow-slate-950/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/40 border-b border-slate-800">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Transaction</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Category</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Batch ID</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Amount</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-800/30 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-100">{exp.vendor}</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase mt-0.5 tracking-wider">{exp.id} • {exp.date}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full">
                      <Tag size={12} className="text-[#F15D38]" />
                      {exp.category}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="font-mono text-xs font-bold text-[#F15D38] bg-[#F15D38]/10 border border-[#F15D38]/20 px-2 py-1 rounded">
                      {exp.batchId}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-full ${
                      exp.status === 'PAID' ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-800/20' : 'bg-amber-950/30 text-amber-400 border border-amber-800/20'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${exp.status === 'PAID' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {exp.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <span className="font-black text-slate-100">${exp.amount.toLocaleString()}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 hover:bg-slate-800 text-slate-400 hover:text-slate-100 rounded-lg transition-colors" title="Edit Expense">
                        <Pencil size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(exp.id)}
                        className="p-2 hover:bg-rose-950/30 text-slate-400 hover:text-rose-500 rounded-lg transition-colors" 
                        title="Delete Expense"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-10 text-center text-xs font-bold text-slate-500">No expense records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
