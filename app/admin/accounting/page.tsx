'use client';

import { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight,
  Search,
  Filter,
  Plus,
  MoreVertical,
  ChevronRight,
  Download,
  Calendar,
  Wallet,
  Building2,
  PieChart,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

type TabType = 'overview' | 'invoices' | 'bills' | 'accounts' | 'reports';

export default function AccountingPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  const revenueData = [
    { name: 'Jan', amount: 4000 },
    { name: 'Feb', amount: 3000 },
    { name: 'Mar', amount: 5000 },
    { name: 'Apr', amount: 4500 },
    { name: 'May', amount: 6000 },
    { name: 'Jun', amount: 5500 },
  ];

  const expensesData = [
    { name: 'Shipping', value: 2500, color: '#3b82f6' },
    { name: 'Customs', value: 1800, color: '#10b981' },
    { name: 'Trucking', value: 1200, color: '#f59e0b' },
    { name: 'Other', value: 800, color: '#6366f1' },
  ];

  const invoices = [
    { id: 'INV-1001', customer: 'Ahmed Ali', date: '2024-05-20', due: '2024-06-20', amount: 4500.00, status: 'PAID' },
    { id: 'INV-1002', customer: 'Sahra Hassan', date: '2024-05-18', due: '2024-06-18', amount: 1250.00, status: 'PARTIAL' },
    { id: 'INV-1003', customer: 'Mohamed Ibrahim', date: '2024-05-15', due: '2024-06-15', amount: 3200.00, status: 'UNPAID' },
  ];

  const bills = [
    { id: 'BIL-901', vendor: 'Hargeisa Port', date: '2024-05-15', due: '2024-05-30', amount: 1200.00, status: 'PAID' },
    { id: 'BIL-902', vendor: 'Air Cargo Fuel', date: '2024-05-18', due: '2024-06-01', amount: 4500.00, status: 'PENDING' },
  ];

  const chartOfAccounts = [
    { name: 'Cash on Hand', type: 'Asset', balance: 12450.00 },
    { name: 'Accounts Receivable', type: 'Asset', balance: 8400.00 },
    { name: 'Accounts Payable', type: 'Liability', balance: 5700.00 },
    { name: 'Service Revenue', type: 'Income', balance: 142000.00 },
    { name: 'Shipping Expenses', type: 'Expense', balance: 68000.00 },
  ];

  return (
    <div className="admin-container pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Financial Command Center</h1>
          <p className="text-slate-500 font-medium">Global ledger, invoicing, and profit tracking</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none btn bg-white border border-slate-200 text-slate-600 flex items-center justify-center gap-2 hover:bg-slate-50 shadow-sm">
            <Download size={18} />
            Fiscal Report
          </button>
          <button className="flex-1 md:flex-none btn btn-primary flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20">
            <Plus size={18} />
            New Transaction
          </button>
        </div>
      </div>

      {/* Modern Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-[1.5rem] w-fit mb-10 overflow-x-auto max-w-full">
        {[
          { id: 'overview', name: 'Overview', icon: PieChart },
          { id: 'invoices', name: 'Customer Invoices', icon: DollarSign },
          { id: 'bills', name: 'Vendor Bills', icon: CreditCard },
          { id: 'accounts', name: 'Chart of Accounts', icon: Building2 },
          { id: 'reports', name: 'Profit Reports', icon: BarChart3 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-white text-blue-600 shadow-md' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon size={14} />
            {tab.name}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-10 animate-in fade-in duration-500">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: 'Total Revenue', value: '$142,500', trend: '+12.5%', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Operational Costs', value: '$68,200', trend: '-8.2%', icon: TrendingDown, color: 'text-rose-600', bg: 'bg-rose-50' },
              { label: 'Net Profit', value: '$74,300', trend: '+15.3%', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Accounts Receivable', value: '$12,450', trend: 'Critical', icon: Wallet, color: 'text-amber-600', bg: 'bg-amber-50' },
            ].map((stat) => (
              <div key={stat.label} className="shipment-card">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                    <stat.icon size={24} />
                  </div>
                  <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${
                    stat.trend.includes('+') ? 'bg-emerald-50 text-emerald-600' : 
                    stat.trend === 'Critical' ? 'bg-rose-50 text-rose-600' : 'bg-rose-50 text-rose-600'
                  }`}>
                    {stat.trend}
                  </span>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{stat.value}</h3>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Main Graph */}
            <div className="lg:col-span-2 shipment-card">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Revenue Forecast</h3>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-slate-50 text-[10px] font-bold rounded-lg text-slate-400">Weekly</button>
                  <button className="px-3 py-1 bg-blue-600 text-[10px] font-bold rounded-lg text-white shadow-lg shadow-blue-600/20">Monthly</button>
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Side Table: Pending Payables */}
            <div className="shipment-card">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8">Urgent Payables</h3>
              <div className="space-y-6">
                {bills.map((bill) => (
                  <div key={bill.id} className="flex justify-between items-center group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-rose-50 group-hover:text-rose-600 transition-colors">
                        <Building2 size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{bill.vendor}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Due: {bill.due}</p>
                      </div>
                    </div>
                    <p className="text-sm font-black text-slate-900">${bill.amount.toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <button className="w-full mt-10 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">
                Settle All Bills
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="shipment-card !p-0 overflow-hidden animate-in slide-in-from-right-4 duration-500">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice / Customer</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Issue Date</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Due Date</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/30 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-mono text-sm font-black text-slate-900">{inv.id}</span>
                      <span className="text-xs font-bold text-slate-400">{inv.customer}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-xs font-bold text-slate-600">{inv.date}</td>
                  <td className="px-8 py-6 text-xs font-bold text-slate-600">{inv.due}</td>
                  <td className="px-8 py-6">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-full ${
                      inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 
                      inv.status === 'PARTIAL' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        inv.status === 'PAID' ? 'bg-emerald-500' : 
                        inv.status === 'PARTIAL' ? 'bg-blue-500' : 'bg-rose-500'
                      }`} />
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right font-black text-slate-900">${inv.amount.toLocaleString()}</td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors" title="Record Payment">
                        <Wallet size={16} />
                      </button>
                      <button className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-900 rounded-lg transition-colors" title="Download PDF">
                        <Download size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'accounts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in zoom-in-95 duration-500">
          {chartOfAccounts.map((account) => (
            <div key={account.name} className="shipment-card group hover:border-blue-200 transition-all">
              <div className="flex justify-between items-center mb-6">
                <span className={`text-[10px] font-black px-2 py-1 rounded ${
                  account.type === 'Asset' ? 'bg-blue-50 text-blue-600' :
                  account.type === 'Liability' ? 'bg-rose-50 text-rose-600' :
                  account.type === 'Income' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                }`}>
                  {account.type.toUpperCase()}
                </span>
                <MoreVertical size={16} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h4 className="text-lg font-black text-slate-900 mb-1">{account.name}</h4>
              <p className="text-3xl font-black text-slate-900">${account.balance.toLocaleString()}</p>
              <div className="mt-6 pt-6 border-t border-slate-50 flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Balance</span>
                <button className="text-[10px] font-black text-blue-600 hover:underline">View Journal</button>
              </div>
            </div>
          ))}
          <button className="shipment-card border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 hover:border-blue-400 hover:bg-blue-50/30 transition-all py-12">
            <div className="p-4 rounded-full bg-slate-50 text-slate-400">
              <Plus size={32} />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Add New Account</p>
          </button>
        </div>
      )}
    </div>
  );
}
