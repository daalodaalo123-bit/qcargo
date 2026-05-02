'use client';

import { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter,
  ShoppingCart, 
  DollarSign, 
  RefreshCcw,
  ExternalLink,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Package,
  ArrowUpRight,
  Pencil,
  Trash2,
  Download,
  Building2
} from 'lucide-react';
import Link from 'next/link';

export default function PurchasesPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const orders = [
    { id: '1', orderNumber: 'PUR-2024-001', customer: 'Mustafe Ismail', supplier: 'Guangzhou Electronics Co.', items: 3, totalUSD: 1450.00, paidUSD: 1450.00, paymentStatus: 'PAID', status: 'IN_WAREHOUSE', date: '2024-05-10' },
    { id: '2', orderNumber: 'PUR-2024-002', customer: 'Sahra Hassan', supplier: 'Yiwu Fashion Hub', items: 1, totalUSD: 850.00, paidUSD: 400.00, paymentStatus: 'PARTIAL', status: 'ORDERED', date: '2024-05-18' },
    { id: '3', orderNumber: 'PUR-2024-003', customer: 'Ahmed Ali', supplier: 'Shenzhen Tech Ltd', items: 12, totalUSD: 5200.00, paidUSD: 5200.00, paymentStatus: 'PAID', status: 'SHIPPED', date: '2024-05-20' },
  ];

  return (
    <div className="admin-container">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Sourcing & Procurement</h1>
          <p className="text-slate-500 font-medium">Manage customer orders from international suppliers</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none btn bg-white border border-slate-200 text-slate-600 flex items-center justify-center gap-2 hover:bg-slate-50 shadow-sm">
            <Download size={18} />
            Export Orders
          </button>
          <Link href="/admin/purchases/new" className="flex-1 md:flex-none btn btn-primary flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20">
            <Plus size={18} />
            New Sourcing
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="shipment-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <ShoppingCart size={20} />
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">Active</span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Open Orders</p>
          <h3 className="text-2xl font-black text-slate-900">28</h3>
        </div>
        <div className="shipment-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign size={20} />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Purchasing Volume</p>
          <h3 className="text-2xl font-black text-slate-900">$42.5k</h3>
        </div>
        <div className="shipment-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock size={20} />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Payment</p>
          <h3 className="text-2xl font-black text-slate-900">$4,800</h3>
        </div>
        <div className="shipment-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-xl bg-slate-900 text-white">
              <Building2 size={20} />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Suppliers</p>
          <h3 className="text-2xl font-black text-slate-900">124</h3>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search Order #, Customer, or Supplier..." 
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

      {/* Purchases Table */}
      <div className="shipment-card !p-0 overflow-hidden border-none shadow-xl shadow-slate-200/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Order / Date</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Customer & Supplier</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Logistics Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Payment</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Value</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/30 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-mono text-sm font-black text-slate-900">{order.orderNumber}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-wider">{order.date}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 text-xs">{order.customer}</span>
                      <span className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-1">
                        <Building2 size={10} /> {order.supplier}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-full ${
                      order.status === 'IN_WAREHOUSE' ? 'bg-emerald-50 text-emerald-600' : 
                      order.status === 'SHIPPED' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {order.status === 'SHIPPED' ? <RefreshCcw size={12} className="animate-spin-slow" /> : <Package size={12} />}
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded w-fit ${
                        order.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                      }`}>
                        {order.paymentStatus}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 mt-1">Paid: ${order.paidUSD.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-black text-slate-900">${order.totalUSD.toLocaleString()}</span>
                      <span className="text-[10px] font-bold text-slate-400">{order.items} Units</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/admin/purchases/${order.id}`} className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors" title="Edit Order">
                        <Pencil size={16} />
                      </Link>
                      <button className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors" title="Delete Order">
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
