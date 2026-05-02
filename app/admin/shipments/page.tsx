'use client';

import { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Truck, 
  Ship,
  Plane, 
  MoreVertical,
  CheckCircle2,
  Clock,
  DollarSign,
  User,
  ArrowRight,
  TrendingUp,
  Package,
  Calendar,
  Pencil,
  Trash2,
  Download
} from 'lucide-react';
import Link from 'next/link';

export default function ShipmentsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const shipments = [
    { id: '1', shipmentNumber: 'AIR-2024-KM-901', customer: 'Khadar Mohamed', type: 'AIR', status: 'ARRIVED', payment: 'PAID', total: 245.50, batch: 'FLT-2024-001', date: '2024-05-18' },
    { id: '2', shipmentNumber: 'SEA-2024-AD-312', customer: 'Abdi Dahir', type: 'SEA', status: 'IN_TRANSIT', payment: 'UNPAID', total: 1200.00, batch: 'CTN-2024-042', date: '2024-05-15' },
    { id: '3', shipmentNumber: 'AIR-2024-ZA-505', customer: 'Zahra Ahmed', type: 'AIR', status: 'PENDING', payment: 'PAID', total: 450.00, batch: 'FLT-2024-002', date: '2024-05-20' },
  ];

  return (
    <div className="admin-container">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Shipment Manifest</h1>
          <p className="text-slate-500 font-medium">Global tracking and individual package management</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none btn bg-white border border-slate-200 text-slate-600 flex items-center justify-center gap-2 hover:bg-slate-50 shadow-sm">
            <Download size={18} />
            Manifest PDF
          </button>
          <Link href="/admin/shipments/new" className="flex-1 md:flex-none btn btn-primary flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20">
            <Plus size={18} />
            New Shipment
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="shipment-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Package size={20} />
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">Live</span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Shipments</p>
          <h3 className="text-2xl font-black text-slate-900">1,240</h3>
        </div>
        <div className="shipment-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Delivered</p>
          <h3 className="text-2xl font-black text-slate-900">892</h3>
        </div>
        <div className="shipment-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock size={20} />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">In Transit</p>
          <h3 className="text-2xl font-black text-slate-900">348</h3>
        </div>
        <div className="shipment-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <DollarSign size={20} />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Payment</p>
          <h3 className="text-2xl font-black text-slate-900">$12,500</h3>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search Shipment #, Customer, or Phone..." 
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

      {/* Shipments Table */}
      <div className="shipment-card !p-0 overflow-hidden border-none shadow-xl shadow-slate-200/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Shipment / Customer</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Type</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Route & Batch</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Charges</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {shipments.map((ship) => (
                <tr key={ship.id} className="hover:bg-slate-50/30 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${ship.type === 'AIR' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {ship.type === 'AIR' ? <Plane size={18} /> : <Ship size={18} />}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-mono text-sm font-black text-slate-900">{ship.shipmentNumber}</span>
                        <span className="text-xs font-bold text-slate-400">{ship.customer}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full ${
                      ship.type === 'AIR' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {ship.type} FREIGHT
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-600">Guangzhou → Mogadishu</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-wider">{ship.batch}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-full ${
                      ship.status === 'ARRIVED' ? 'bg-emerald-50 text-emerald-600' : 
                      ship.status === 'IN_TRANSIT' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        ship.status === 'ARRIVED' ? 'bg-emerald-500' : 
                        ship.status === 'IN_TRANSIT' ? 'bg-blue-500' : 'bg-slate-400'
                      }`} />
                      {ship.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-black text-slate-900">${ship.total.toFixed(2)}</span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded mt-1 ${
                        ship.payment === 'PAID' ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'
                      }`}>
                        {ship.payment}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/admin/shipments/${ship.id}`} className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors" title="Edit Shipment">
                        <Pencil size={16} />
                      </Link>
                      <button className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors" title="Delete Shipment">
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
