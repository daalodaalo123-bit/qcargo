'use client';

import { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Truck, 
  Plane, 
  Ship,
  CheckCircle2, 
  Clock, 
  ArrowRight,
  TrendingUp,
  Box,
  Calendar,
  Pencil,
  Trash2,
  Download,
  AlertCircle,
  Users
} from 'lucide-react';
import Link from 'next/link';

export default function BatchesPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const batches = [
    { id: '1', batchId: 'FLT-2024-001', type: 'AIR', origin: 'China', destination: 'Somaliland', status: 'IN_TRANSIT', shipments: 45, weight: '850kg', arrival: '2024-06-01' },
    { id: '2', batchId: 'CTN-2024-042', type: 'SEA', origin: 'China', destination: 'Somaliland', status: 'LOADING', shipments: 120, weight: '45.5 CBM', arrival: '2024-06-15' },
    { id: '3', batchId: 'FLT-2024-002', type: 'AIR', origin: 'China', destination: 'Somaliland', status: 'ARRIVED', shipments: 32, weight: '620kg', arrival: '2024-05-20' },
  ];

  return (
    <div className="admin-container">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Master Batches</h1>
          <p className="text-slate-500 font-medium">Consolidated cargo management and manifest control</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none btn bg-white border border-slate-200 text-slate-600 flex items-center justify-center gap-2 hover:bg-slate-50 shadow-sm">
            <Download size={18} />
            Bulk Manifest
          </button>
          <Link href="/admin/batches/new" className="flex-1 md:flex-none btn btn-primary flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20">
            <Plus size={18} />
            New Batch
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="shipment-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Box size={20} />
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">Active</span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Open Batches</p>
          <h3 className="text-2xl font-black text-slate-900">24</h3>
        </div>
        <div className="shipment-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Ship size={20} />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sea Containers</p>
          <h3 className="text-2xl font-black text-slate-900">8</h3>
        </div>
        <div className="shipment-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Plane size={20} />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Air Flights</p>
          <h3 className="text-2xl font-black text-slate-900">16</h3>
        </div>
        <div className="shipment-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-xl bg-slate-50 text-slate-400">
              <Users size={20} />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Clients</p>
          <h3 className="text-2xl font-black text-slate-900">412</h3>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search Batch ID or Route..." 
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

      {/* Batches Table */}
      <div className="shipment-card !p-0 overflow-hidden border-none shadow-xl shadow-slate-200/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Batch ID / Type</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Origin → Destination</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Shipments</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Manifest Load</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {batches.map((batch) => (
                <tr key={batch.id} className="hover:bg-slate-50/30 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${batch.type === 'AIR' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {batch.type === 'AIR' ? <Plane size={18} /> : <Ship size={18} />}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-mono text-sm font-black text-slate-900">{batch.batchId}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{batch.type} FREIGHT</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-600">{batch.origin}</span>
                      <ArrowRight size={12} className="text-slate-300" />
                      <span className="text-xs font-bold text-slate-600">{batch.destination}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{batch.shipments}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Items</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-full ${
                      batch.status === 'ARRIVED' ? 'bg-emerald-50 text-emerald-600' : 
                      batch.status === 'IN_TRANSIT' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        batch.status === 'ARRIVED' ? 'bg-emerald-500' : 
                        batch.status === 'IN_TRANSIT' ? 'bg-blue-500' : 'bg-amber-500'
                      }`} />
                      {batch.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <span className="font-black text-slate-900">{batch.weight}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/admin/batches/${batch.id}`} className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors" title="Edit Batch">
                        <Pencil size={16} />
                      </Link>
                      <button className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors" title="Delete Batch">
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

      <div className="mt-8 flex items-center gap-3 bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100">
        <AlertCircle className="text-blue-600" size={24} />
        <p className="text-xs font-medium text-blue-800 leading-relaxed">
          Master batches allow you to update tracking status for all individual shipments at once. Changing the status of a batch will automatically notify all linked customers.
        </p>
      </div>
    </div>
  );
}
