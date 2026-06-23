'use client';

import { useState, useEffect } from 'react';
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
  Users,
  Warehouse
} from 'lucide-react';
import Link from 'next/link';

interface Batch {
  id: string;
  batchId: string;
  type: 'AIR' | 'SEA';
  origin: string;
  destination: string;
  status: 'IN_TRANSIT' | 'LOADING' | 'ARRIVED';
  shipments: number;
  weight: string;
  arrival: string;
  statusChanged?: boolean;
}



export default function BatchesPage() {
const [searchTerm, setSearchTerm] = useState('');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [totalClients, setTotalClients] = useState<number>(0);

  // Load batches and customer count from DB on mount
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const res = await fetch('/api/batches');
        if (!res.ok) throw new Error('Failed to load batches');
        const data = await res.json();
        setBatches(data.map((b: any) => ({ ...b, id: b._id || b.id })));
      } catch (e) {
        console.error(e);
      }
    };
    const fetchCustomerCount = async () => {
      try {
        const res = await fetch('/api/customers');
        if (!res.ok) return;
        const data = await res.json();
        setTotalClients(Array.isArray(data) ? data.length : 0);
      } catch (e) {
        console.error(e);
      }
    };
    fetchBatches();
    fetchCustomerCount();
  }, []);


  // Update status and trigger SMS
  const handleStatusChange = async (id: string, newStatus: Batch['status']) => {
    setBatches(prev => prev.map(b => {
      if (b.id === id) {
        return { ...b, status: newStatus, statusChanged: true };
      }
      return b;
    }));
    // Send SMS via API
    try {
      await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId: id, status: newStatus }),
      });
    } catch (e) {
      console.error('SMS send failed', e);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this batch manifest?')) {
      try {
        const res = await fetch(`/api/batches?id=${id}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete batch');
        setBatches(batches.filter(b => b.id !== id));
        alert('Batch deleted successfully!');
      } catch (err: any) {
        console.error(err);
        alert(`Error deleting batch: ${err.message}`);
      }
    }
  };

  const handleBulkManifest = async () => {
    try {
      // Fetch all batches with their shipments
      const res = await fetch('/api/batches');
      if (!res.ok) throw new Error('Failed to load batches');
      const batchData: any[] = await res.json();

      const rows: string[][] = [
        ['Batch ID', 'Type', 'Status', 'Origin', 'Destination', 'Shipments', 'Weight', 'Arrival'],
      ];

      for (const b of batchData) {
        // Fetch shipments for each batch
        const sRes = await fetch(`/api/batches?id=${b._id || b.id}`);
        if (!sRes.ok) continue;
        const bDetail = await sRes.json();
        const shipments: any[] = bDetail.shipmentsList || [];

        rows.push([b.batchId, b.type, b.status, b.origin, b.destination, String(shipments.length), b.weight, b.arrival || '']);

        // Add shipment detail rows
        for (const s of shipments) {
          rows.push([
            '', '', '', '',
            `  → ${s.shipmentNumber}`,
            s.customer,
            s.type,
            s.status,
            s.paymentStatus,
            `$${s.total}`,
            s.notes || '',
          ]);
        }

        rows.push([]); // blank separator between batches
      }

      const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qcargo-manifest-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Manifest export failed: ${err.message}`);
    }
  };

  const filteredBatches = batches.filter(batch => 
    batch.batchId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.destination.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-container">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight">Master Batches</h1>
          <p className="text-slate-400 font-medium">Consolidated cargo management and manifest control</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Link href="/admin/warehouse"
            className="flex-1 md:flex-none btn bg-white border border-slate-800 text-slate-300 flex items-center justify-center gap-2 hover:bg-slate-800 shadow-sm"
          >
            <Warehouse size={18} />
            Warehouse Lookup
          </Link>
          <button
            onClick={handleBulkManifest}
            className="flex-1 md:flex-none btn bg-white border border-slate-800 text-slate-300 flex items-center justify-center gap-2 hover:bg-slate-800 shadow-sm"
          >
            <Download size={18} />
            Bulk Manifest
          </button>
          <Link href="/admin/batches/new" className="flex-1 md:flex-none btn btn-primary flex items-center justify-center gap-2 shadow-lg shadow-[#F15D38]/20">
            <Plus size={18} />
            New Batch
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="shipment-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-xl bg-[#F15D38]/10 text-[#F15D38]">
              <Box size={20} />
            </div>
            <span className="text-xs font-bold text-[#F15D38] bg-[#F15D38]/10 px-2 py-0.5 rounded-lg">Active</span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Open Batches</p>
          <h3 className="text-2xl font-black text-slate-100">{batches.filter(b => b.status !== 'ARRIVED').length}</h3>
        </div>
        <div className="shipment-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-xl bg-emerald-950/30 text-emerald-400 border border-emerald-800/20">
              <Ship size={20} />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sea Containers</p>
          <h3 className="text-2xl font-black text-slate-100">{batches.filter(b => b.type === 'SEA').length}</h3>
        </div>
        <div className="shipment-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-xl bg-amber-950/30 text-amber-400 border border-amber-800/20">
              <Plane size={20} />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Air Flights</p>
          <h3 className="text-2xl font-black text-slate-100">{batches.filter(b => b.type === 'AIR').length}</h3>
        </div>
        <div className="shipment-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-xl bg-slate-900 text-slate-400 border border-slate-800">
              <Users size={20} />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Clients</p>
          <h3 className="text-2xl font-black text-slate-100">{totalClients}</h3>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#F15D38] transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search Batch ID or Route..." 
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

      {/* Batches Table */}
      <div className="shipment-card !p-0 overflow-hidden border border-slate-800 shadow-xl shadow-slate-950/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/40 border-b border-slate-800">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Batch ID / Type</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Origin → Destination</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Shipments</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cartons</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Weight / Load</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredBatches.map((batch) => (
                <tr key={batch.id} className="hover:bg-slate-800/30 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${batch.type === 'AIR' ? 'bg-[#F15D38]/10 text-[#F15D38] border border-[#F15D38]/20' : 'bg-emerald-950/30 text-emerald-400 border border-emerald-800/20'}`}>
                        {batch.type === 'AIR' ? <Plane size={18} /> : <Ship size={18} />}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-mono text-sm font-black text-slate-100">{batch.batchId}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{batch.type} FREIGHT</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-300">{batch.origin}</span>
                      <ArrowRight size={12} className="text-slate-500" />
                      <span className="text-xs font-bold text-slate-300">{batch.destination}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100">{batch.shipments}</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Pkgs</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#F15D38]">{(batch as any).totalCartons ?? 0}</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Ctns</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    {batch.statusChanged ? (
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-full ${
                        batch.status === 'ARRIVED' ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-800/20' :
                        batch.status === 'IN_TRANSIT' ? 'bg-[#F15D38]/10 text-[#F15D38] border border-[#F15D38]/20' : 'bg-amber-950/30 text-amber-400 border border-amber-800/20'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          batch.status === 'ARRIVED' ? 'bg-emerald-500' :
                          batch.status === 'IN_TRANSIT' ? 'bg-[#F15D38]' : 'bg-amber-500'
                        }`} />
                        {batch.status}
                      </span>
                    ) : (
                      <select
                        value={batch.status}
                        onChange={(e) => handleStatusChange(batch.id, e.target.value as Batch['status'])}
                        className="bg-[#131B2E] text-slate-100 border border-slate-600 rounded p-1"
                      >
                        <option value="IN_TRANSIT">IN_TRANSIT</option>
                        <option value="LOADING">LOADING</option>
                        <option value="ARRIVED">ARRIVED</option>
                      </select>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <span className="font-black text-slate-100">{batch.weight}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/admin/batches/${batch.id}`} className="p-2 hover:bg-slate-800 text-slate-400 hover:text-slate-100 rounded-lg transition-colors" title="Edit Batch">
                        <Pencil size={16} />
                      </Link>
                      <button 
                        onClick={() => handleDelete(batch.id)}
                        className="p-2 hover:bg-rose-950/30 text-slate-400 hover:text-rose-500 rounded-lg transition-colors" 
                        title="Delete Batch"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredBatches.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-8 py-10 text-center text-xs font-bold text-slate-500">No batches match your query.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-3 bg-[#F15D38]/10 p-6 rounded-[2rem] border border-[#F15D38]/20">
        <AlertCircle className="text-[#F15D38]" size={24} />
        <p className="text-xs font-medium text-slate-300 leading-relaxed">
          Master batches allow you to update tracking status for all individual shipments at once. Changing the status of a batch will automatically notify all linked customers.
        </p>
      </div>
    </div>
  );
}
