'use client';

import { useState } from 'react';
import { 
  UserPlus, 
  Search, 
  Phone, 
  Mail, 
  MapPin,
  Filter,
  TrendingUp,
  AlertCircle,
  MoreVertical,
  ChevronRight,
  Pencil,
  Trash2,
  Download,
  Star,
  Users
} from 'lucide-react';
import Link from 'next/link';

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const customers = [
    { id: '1', name: 'Mustafe Ismail', phone: '+252 63 777 8986', city: 'Hargeisa', totalShipments: 12, totalSpent: 4500.00, balance: 0.00, status: 'VIP' },
    { id: '2', name: 'Sahra Hassan', phone: '+252 63 444 2211', city: 'Berbera', totalShipments: 3, totalSpent: 850.00, balance: 150.00, status: 'ACTIVE' },
    { id: '3', name: 'Ahmed Ali', phone: '+252 61 555 1234', city: 'Hargeisa', totalShipments: 28, totalSpent: 12400.00, balance: 0.00, status: 'VIP' },
  ];

  return (
    <div className="admin-container">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Customer CRM</h1>
          <p className="text-slate-500 font-medium">Relationship management and client transaction history</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none btn bg-white border border-slate-200 text-slate-600 flex items-center justify-center gap-2 hover:bg-slate-50 shadow-sm">
            <Download size={18} />
            Export List
          </button>
          <button className="flex-1 md:flex-none btn btn-primary flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20">
            <UserPlus size={18} />
            Add Customer
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="shipment-card">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Total Portfolio</p>
          <div className="flex items-center justify-between">
            <h3 className="text-3xl font-black text-slate-900">1,240</h3>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Users size={20} />
            </div>
          </div>
        </div>
        <div className="shipment-card">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Account Receivables</p>
          <div className="flex items-center justify-between">
            <h3 className="text-3xl font-black text-rose-600">$3,450.00</h3>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <AlertCircle size={20} />
            </div>
          </div>
        </div>
        <div className="shipment-card">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">VIP Retention</p>
          <div className="flex items-center justify-between">
            <h3 className="text-3xl font-black text-slate-900">15%</h3>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-500">
              <Star size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search by Name, Phone, or Location..." 
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

      {/* CRM Table */}
      <div className="shipment-card !p-0 overflow-hidden border-none shadow-xl shadow-slate-200/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Customer / Contact</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Location</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Shipment Count</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tier</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Balance</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {customers.map((cust) => (
                <tr key={cust.id} className="hover:bg-slate-50/30 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xs">
                        {cust.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{cust.name}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-wider">{cust.phone}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <MapPin size={12} className="text-slate-300" />
                      <span className="text-xs font-bold text-slate-600">{cust.city}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{cust.totalShipments}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Orders</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full ${
                      cust.status === 'VIP' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {cust.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex flex-col items-end">
                      <span className={`font-black ${cust.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {cust.balance > 0 ? `-$${cust.balance.toFixed(2)}` : 'CLEAN'}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase mt-1">Total: ${cust.totalSpent.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/admin/customers/${cust.id}`} className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors" title="View/Edit Profile">
                        <Pencil size={16} />
                      </Link>
                      <button className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors" title="Delete Customer">
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
