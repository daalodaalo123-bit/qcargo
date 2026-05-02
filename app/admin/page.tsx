'use client';

import { 
  Package, 
  Ship, 
  Plane, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  Plus,
  FileText
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  // Mock Stats
  const stats = [
    { label: 'Active Batches', value: '12', icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Sea Shipments', value: '8', icon: Ship, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Air Shipments', value: '4', icon: Plane, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Total Revenue', value: '$45,200', icon: DollarSign, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  const recentBatches = [
    { id: 'DUR-2024-001', customer: 'Ahmed Ali', type: 'SEA', status: 'IN_TRANSIT', date: '2024-05-18' },
    { id: 'DUR-2024-002', customer: 'Mohamed Ibrahim', type: 'AIR', status: 'ARRIVED', date: '2024-05-17' },
    { id: 'DUR-2024-003', customer: 'Fatima Omar', type: 'SEA', status: 'PENDING', date: '2024-05-16' },
  ];

  return (
    <div className="admin-container pb-20">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Agent Dashboard</h1>
          <p className="text-slate-500 font-medium">Welcome back, here's what's happening with Durdur Cargo today.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/batches/new" className="btn btn-primary">
            <Plus size={18} />
            New Batch
          </Link>
          <Link href="/admin/quotations/new" className="btn bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">
            <FileText size={18} />
            Create Quotation
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat) => (
          <div key={stat.label} className="shipment-card flex items-center gap-5 group">
            <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} transition-transform group-hover:scale-110`}>
              <stat.icon size={28} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="shipment-card !p-0 overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Recent Activity</h3>
              <Link href="/admin/batches" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                View All Batches
                <ChevronRight size={14} />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Batch ID</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Customer</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentBatches.map((batch) => (
                    <tr key={batch.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${batch.type === 'SEA' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                            {batch.type === 'SEA' ? <Ship size={16} /> : <Plane size={16} />}
                          </div>
                          <span className="font-bold text-slate-900">{batch.id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-medium">{batch.customer}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                          batch.status === 'ARRIVED' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {batch.status === 'ARRIVED' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                          {batch.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/admin/batches/${batch.id}`} className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                          <ChevronRight size={20} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-[2rem] shadow-xl text-white">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-white/10 rounded-2xl text-blue-400">
                <TrendingUp size={24} />
              </div>
              <h3 className="text-lg font-bold">Growth Insight</h3>
            </div>
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              Your sea shipments are up by <span className="text-emerald-400 font-bold">24%</span> this month. Consider optimizing your container space for better margins.
            </p>
            <button className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold transition-all">
              View Detailed Reports
            </button>
          </div>

          <div className="shipment-card bg-blue-600 text-white border-none shadow-blue-100">
            <h3 className="font-bold mb-2">Need Help?</h3>
            <p className="text-sm opacity-80 mb-4">Check our support documentation for logistics management tips.</p>
            <button className="text-sm font-bold underline">Support Center</button>
          </div>
        </div>
      </div>
    </div>
  );
}
