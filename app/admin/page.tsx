'use client';

import { useState, useEffect } from 'react';
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
  FileText,
  CheckSquare,
  Users
} from 'lucide-react';
import Link from 'next/link';

interface Task {
  id: string;
  title: string;
  assignee: string;
  status: string;
  priority: string;
}

export default function AdminDashboard() {
  const [activeTasksCount, setActiveTasksCount] = useState(0);
  const [batchStats, setBatchStats] = useState({ total: 0, sea: 0, air: 0 });
  const [recentBatchList, setRecentBatchList] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  // Load live batch stats & co-op tasks from MongoDB
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [batchesRes, tasksRes] = await Promise.all([
          fetch('/api/batches'),
          fetch('/api/tasks')
        ]);

        if (batchesRes.ok) {
          const data = await batchesRes.json();
          const activeBatches = data.filter((b: any) => b.status !== 'ARRIVED');
          setBatchStats({
            total: activeBatches.length,
            sea: activeBatches.filter((b: any) => b.type === 'SEA').length,
            air: activeBatches.filter((b: any) => b.type === 'AIR').length,
          });
          setRecentBatchList(data.slice(0, 3));
        }

        if (tasksRes.ok) {
          const data = await tasksRes.json();
          const mapped = data.map((t: any) => ({
            id: t._id || t.id,
            title: t.title,
            assignee: t.assignee,
            status: t.status === 'In Progress' ? 'In_Progress' : t.status,
            priority: t.priority
          }));
          setTasks(mapped.slice(0, 3));
          setActiveTasksCount(mapped.filter((t: any) => t.status !== 'Completed').length);
        }
      } catch (e) {
        console.error('Failed to load dashboard data', e);
      }
    };
    fetchDashboardData();
  }, []);

  const stats = [
    { label: 'Active Batches', value: batchStats.total.toString(), icon: Package, color: 'text-[#F15D38]', bg: 'bg-[#F15D38]/10 border border-[#F15D38]/20' },
    { label: 'Sea Freight', value: batchStats.sea.toString(), icon: Ship, color: 'text-emerald-400', bg: 'bg-emerald-950/30 border border-emerald-800/20' },
    { label: 'Air Freight', value: batchStats.air.toString(), icon: Plane, color: 'text-amber-400', bg: 'bg-amber-950/30 border border-amber-800/20' },
    { label: 'Co-Ops Open Tasks', value: activeTasksCount.toString(), icon: CheckSquare, color: 'text-[#F15D38]', bg: 'bg-[#F15D38]/10 border border-[#F15D38]/20' },
  ];

  const recentBatches = recentBatchList.length > 0 ? recentBatchList.map((b: any) => ({
    id: b.batchId,
    customer: b.origin?.split(',')[0] || 'China',
    type: b.type,
    status: b.status,
    date: b.arrival || b.createdAt?.split('T')[0] || '—'
  })) : [];

  return (
    <div className="admin-container pb-20">
      
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight">Admin Dashboard</h1>
          <p className="text-slate-400 font-medium">Welcome back! Manage the Hargeisa operations of Durdur Cargo today.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Link href="/admin/batches/new" className="flex-1 md:flex-none btn btn-primary flex items-center justify-center gap-2 shadow-lg shadow-[#F15D38]/20">
            <Plus size={18} />
            New Batch
          </Link>
          <Link href="/admin/quotations/new" className="flex-1 md:flex-none btn bg-[#131B2E] border border-slate-800 text-slate-300 flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors">
            <FileText size={18} />
            Create Quotation
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat) => (
          <div key={stat.label} className={`shipment-card flex items-center gap-5 group transition-all duration-300 ${stat.bg}`}>
            <div className={`p-4 rounded-2xl ${stat.color} bg-slate-950 border border-slate-800 group-hover:scale-110 transition-transform`}>
              <stat.icon size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black text-slate-100 mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Batches manifests */}
        <div className="lg:col-span-2 space-y-6">
          <div className="shipment-card !p-0 overflow-hidden border border-slate-800 bg-[#131B2E] shadow-xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest">Master Manifest Queue</h3>
              <Link href="/admin/batches" className="text-xs font-bold text-[#F15D38] hover:underline flex items-center gap-1">
                View All manifests
                <ChevronRight size={14} />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-900/40 border-b border-slate-800">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Manifest ID</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Primary Client</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Route</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {recentBatches.map((batch) => (
                    <tr key={batch.id} className="hover:bg-slate-800/20 transition-all group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${batch.type === 'SEA' ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-800/20' : 'bg-[#F15D38]/10 text-[#F15D38] border border-[#F15D38]/20'}`}>
                            {batch.type === 'SEA' ? <Ship size={16} /> : <Plane size={16} />}
                          </div>
                          <span className="font-mono text-sm font-black text-slate-100">{batch.id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300 font-medium">{batch.customer}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                          batch.status === 'ARRIVED' ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-800/20' : 
                          batch.status === 'IN_TRANSIT' ? 'bg-[#F15D38]/10 text-[#F15D38] border border-[#F15D38]/20' : 'bg-amber-950/30 text-amber-400 border border-amber-800/20'
                        }`}>
                          {batch.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-xs font-bold text-slate-400">China → Somaliland</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar panels */}
        <div className="space-y-6">
          
          {/* Operations Snapshot panel */}
          <div className="shipment-card border border-slate-800 bg-[#131B2E] shadow-xl">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800">
              <h3 className="text-xs font-black text-slate-200 uppercase tracking-widest flex items-center gap-2">
                <CheckSquare className="text-[#F15D38]" size={16} />
                Co-Op Tasks snapshot
              </h3>
              <Link href="/admin/todo" className="text-[10px] font-black text-[#F15D38] uppercase hover:underline">
                Open board
              </Link>
            </div>
            <div className="space-y-4">
              {tasks.map(task => (
                <div key={task.id} className="p-3 bg-slate-950 border border-slate-900 rounded-xl">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider">
                      For: {task.assignee}
                    </span>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${
                      task.status === 'Completed' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
                    }`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-200 line-clamp-1">{task.title}</p>
                </div>
              ))}
              {tasks.length === 0 && (
                <p className="text-xs font-bold text-slate-500 text-center py-4">No tasks found. Create tasks on the task board!</p>
              )}
            </div>
          </div>

          <div className="bg-[#131B2E] border border-slate-800 p-8 rounded-[2rem] shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-[#F15D38]/10 border border-[#F15D38]/20 rounded-2xl text-[#F15D38]">
                <TrendingUp size={24} />
              </div>
              <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest">Berbera Capacity</h3>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed mb-6 font-medium">
              Your sea containers are operating at <span className="text-emerald-400 font-bold">87%</span> utilization capacity this quarter. Consider booking next container slots to handle Berbera harbor slots efficiently.
            </p>
            <Link 
              href="/admin/batches" 
              className="w-full block py-3 text-center bg-slate-900 hover:bg-[#F15D38] border border-slate-800 hover:border-transparent text-slate-300 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
            >
              Analyze container manifesting
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
