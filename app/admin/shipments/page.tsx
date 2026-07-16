'use client';

import { useState, useEffect } from 'react';
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
  Download,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import EditShipmentModal, { type ShipmentRow } from './EditShipmentModal';
import RecordShipmentPaymentModal, { type PaymentShipment } from './RecordShipmentPaymentModal';

type Shipment = ShipmentRow & {
  paymentStatus?: 'UNPAID' | 'PARTIAL' | 'PAID';
  amountPaid?: number;
  goods?: string;
};

type RawLine = Record<string, unknown>;

// Demo fallback data removed — real shipments come only from the database.

export default function ShipmentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [paymentShipment, setPaymentShipment] = useState<PaymentShipment | null>(null);

  // Load shipments from DB
  const loadShipments = async () => {
    try {
      const res = await fetch('/api/shipments');
      if (!res.ok) throw new Error('Failed to load shipments');
      const data = await res.json();
      setShipments(
        data.map((s: Record<string, unknown>) => {
          const total = Number(s.total) || 0;
          const amountPaid = Number(s.amountPaid ?? s.paidAmount) || 0;
          let paymentStatus = (s.paymentStatus as Shipment['paymentStatus']) || 'UNPAID';
          if (!s.paymentStatus) {
            if (s.payment === 'PAID' || amountPaid >= total - 0.01) paymentStatus = 'PAID';
            else if (amountPaid > 0) paymentStatus = 'PARTIAL';
          }
          const items = Array.isArray(s.items) ? (s.items as { description?: string }[]) : [];
          const goods =
            items
              .map((it) => it.description)
              .filter(Boolean)
              .join(', ') || String(s.shipmentNumber || 'Cargo');
          return {
            id: String(s._id || s.id),
            shipmentNumber: String(s.shipmentNumber || ''),
            customer: String(s.customer || ''),
            phone: s.phone ? String(s.phone) : '',
            type: (s.type as Shipment['type']) || 'SEA',
            status: (s.status as Shipment['status']) || 'PENDING',
            payment: (s.payment as Shipment['payment']) || 'UNPAID',
            paymentStatus,
            amountPaid: paymentStatus === 'PAID' && amountPaid === 0 ? total : amountPaid,
            total,
            batch: String(s.batch || 'UNASSIGNED'),
            date: String(s.date || ''),
            notes: s.notes ? String(s.notes) : '',
            weight: Number(s.weight) || 0,
            cbm: Number(s.cbm) || 0,
            rate: Number(s.rate) || 0,
            customs: Number(s.customs) || 0,
            tax: Number(s.tax) || 0,
            discount: Number(s.discount) || 0,
            goods,
            priceLines: Array.isArray(s.priceLines) ? (s.priceLines as RawLine[]) : [],
            items: Array.isArray(s.items) ? (s.items as RawLine[]) : [],
            courierPackages: Array.isArray(s.courierPackages) ? (s.courierPackages as RawLine[]) : [],
          };
        })
      );
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadShipments();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this shipment?')) {
      try {
        const res = await fetch(`/api/shipments?id=${id}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete shipment');
        setShipments(prev => prev.filter(s => s.id !== id));
        alert('Shipment deleted successfully!');
      } catch (err: any) {
        console.error(err);
        alert(`Error deleting shipment: ${err.message}`);
      }
    }
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Shipment Number,Customer,Type,Status,Payment,Total USD,Batch,Date"].join(",") + "\n"
      + shipments.map(s => `"${s.shipmentNumber}","${s.customer}","${s.type}","${s.status}","${s.payment}",${s.total},"${s.batch}","${s.date}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "qcargo_shipments.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredShipments = shipments.filter(ship => {
    const term = searchTerm.toLowerCase();
    const digits = searchTerm.replace(/\D/g, '');
    const matchesSearch =
      ship.shipmentNumber.toLowerCase().includes(term) ||
      ship.customer.toLowerCase().includes(term) ||
      ship.batch.toLowerCase().includes(term) ||
      (!!digits && (ship.phone || '').replace(/\D/g, '').includes(digits));
    const matchesStatus = !filterStatus || ship.status === filterStatus;
    const matchesPayment = !filterPayment || ship.paymentStatus === filterPayment;
    const shipDate = ship.date ? new Date(ship.date) : null;
    const matchesFrom = !filterDateFrom || (shipDate && shipDate >= new Date(filterDateFrom));
    const matchesTo = !filterDateTo || (shipDate && shipDate <= new Date(filterDateTo + 'T23:59:59'));
    return matchesSearch && matchesStatus && matchesPayment && matchesFrom && matchesTo;
  });

  return (
    <div className="admin-container">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight">Shipment Manifests</h1>
          <p className="text-slate-400 font-medium">Global tracking and individual package management</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={handleExport}
            className="flex-1 md:flex-none btn bg-white border border-slate-800 text-slate-300 flex items-center justify-center gap-2 hover:bg-slate-800 shadow-sm"
          >
            <Download size={18} />
            Export Manifest CSV
          </button>
          <Link 
            href="/admin/shipments/new"
            className="flex-1 md:flex-none btn btn-primary flex items-center justify-center gap-2 shadow-lg shadow-[#F15D38]/20"
          >
            <Plus size={18} />
            New Shipment
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="shipment-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-xl bg-[#F15D38]/10 text-[#F15D38]">
              <Package size={20} />
            </div>
            <span className="text-xs font-bold text-[#F15D38] bg-[#F15D38]/10 px-2 py-0.5 rounded-lg">Live</span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Shipments</p>
          <h3 className="text-2xl font-black text-slate-100">{shipments.length}</h3>
        </div>
        <div className="shipment-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-xl bg-emerald-950/30 text-emerald-400 border border-emerald-800/20">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Delivered</p>
          <h3 className="text-2xl font-black text-slate-100">{shipments.filter(s => s.status === 'ARRIVED').length}</h3>
        </div>
        <div className="shipment-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-xl bg-amber-950/30 text-amber-400 border border-amber-800/20">
              <Clock size={20} />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">In Transit</p>
          <h3 className="text-2xl font-black text-slate-100">{shipments.filter(s => s.status === 'IN_TRANSIT').length}</h3>
        </div>
        <div className="shipment-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-xl bg-rose-950/30 text-rose-400 border border-rose-800/20">
              <DollarSign size={20} />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Payment</p>
          <h3 className="text-2xl font-black text-slate-100">
            $
            {shipments
              .reduce((acc, s) => {
                if (s.paymentStatus === 'PAID') return acc;
                const paid = s.amountPaid || 0;
                return acc + Math.max(0, s.total - paid);
              }, 0)
              .toLocaleString()}
          </h3>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#F15D38] transition-colors" size={20} />
          <input
            type="text"
            placeholder="Search Shipment #, Customer, Phone, or Batch..."
            className="search-input !pl-12 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-end gap-3 mb-10">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-[#F15D38]">
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="IN_TRANSIT">In Transit</option>
          <option value="ARRIVED">Arrived</option>
        </select>
        <select value={filterPayment} onChange={e => setFilterPayment(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-[#F15D38]">
          <option value="">All Payments</option>
          <option value="UNPAID">Unpaid</option>
          <option value="PARTIAL">Partial</option>
          <option value="PAID">Paid</option>
        </select>
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">From</label>
          <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-[#F15D38]" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Until</label>
          <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-[#F15D38]" />
        </div>
        {(filterStatus || filterPayment || filterDateFrom || filterDateTo) && (
          <button onClick={() => { setFilterStatus(''); setFilterPayment(''); setFilterDateFrom(''); setFilterDateTo(''); }}
            className="text-xs font-bold text-slate-400 hover:text-rose-400 transition-colors px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl self-end">
            Clear ×
          </button>
        )}
      </div>

      {/* Shipments Table */}
      <div className="shipment-card !p-0 overflow-hidden border border-slate-800 shadow-xl shadow-slate-950/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/40 border-b border-slate-800">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Shipment / Customer</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Type</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Route & Batch</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Charges</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredShipments.map((ship) => (
                <tr key={ship.id} className="hover:bg-slate-800/30 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${ship.type === 'AIR' ? 'bg-[#F15D38]/10 text-[#F15D38] border border-[#F15D38]/20' : 'bg-emerald-950/30 text-emerald-400 border border-emerald-800/20'}`}>
                        {ship.type === 'AIR' ? <Plane size={18} /> : <Ship size={18} />}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-mono text-sm font-black text-slate-100">{ship.shipmentNumber}</span>
                        <span className="text-xs font-bold text-slate-400">{ship.customer}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full ${
                      ship.type === 'AIR' ? 'bg-[#F15D38]/10 text-[#F15D38] border border-[#F15D38]/20' : 'bg-emerald-950/30 text-emerald-400 border border-emerald-800/20'
                    }`}>
                      {ship.type} FREIGHT
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-300">China → Somaliland</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase mt-0.5 tracking-wider">{ship.batch}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-full ${
                      ship.status === 'ARRIVED' ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-800/20' : 
                      ship.status === 'IN_TRANSIT' ? 'bg-[#F15D38]/10 text-[#F15D38] border border-[#F15D38]/20' : 'bg-amber-950/30 text-amber-400 border border-amber-800/20'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        ship.status === 'ARRIVED' ? 'bg-emerald-500' : 
                        ship.status === 'IN_TRANSIT' ? 'bg-[#F15D38]' : 'bg-amber-500'
                      }`} />
                      {ship.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-black text-slate-100">${ship.total.toFixed(2)}</span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded mt-1 ${
                        ship.paymentStatus === 'PAID'
                          ? 'text-emerald-400 bg-emerald-950/30 border border-emerald-800/20'
                          : ship.paymentStatus === 'PARTIAL'
                            ? 'text-amber-400 bg-amber-950/30 border border-amber-800/20'
                            : 'text-rose-400 bg-rose-950/30 border border-rose-800/20'
                      }`}>
                        {ship.paymentStatus === 'PAID'
                          ? 'PAID'
                          : ship.paymentStatus === 'PARTIAL'
                            ? `PARTIAL · $${(ship.amountPaid || 0).toFixed(0)}`
                            : 'UNPAID'}
                      </span>
                      {ship.paymentStatus === 'PARTIAL' && (
                        <p className="text-[10px] font-bold text-amber-400 mt-0.5">
                          ${Math.max(0, ship.total - (ship.amountPaid || 0)).toFixed(2)} due
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <a
                        href={`/api/shipments/${ship.id}/pdf?type=quotation`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-slate-800 text-slate-400 hover:text-teal-400 rounded-lg transition-colors"
                        title="Download Quotation PDF (goods + cost)"
                      >
                        <FileText size={16} />
                      </a>
                      {ship.paymentStatus !== 'PAID' && (
                        <button
                          onClick={() =>
                            setPaymentShipment({
                              id: ship.id,
                              shipmentNumber: ship.shipmentNumber,
                              customer: ship.customer,
                              phone: ship.phone,
                              goods: ship.shipmentNumber,
                              total: ship.total,
                              date: ship.date,
                              type: ship.type,
                              amountPaid: ship.amountPaid,
                              paymentStatus: ship.paymentStatus,
                            })
                          }
                          className="p-2 hover:bg-emerald-950/30 text-slate-400 hover:text-emerald-400 rounded-lg transition-colors"
                          title={
                            ship.paymentStatus === 'PARTIAL'
                              ? 'Record another payment & send receipt'
                              : 'Record payment & send receipt'
                          }
                        >
                          <DollarSign size={16} />
                        </button>
                      )}
                      <button 
                        onClick={() => setEditingShipment(ship)}
                        className="p-2 hover:bg-slate-800 text-slate-400 hover:text-slate-100 rounded-lg transition-colors" 
                        title="Edit Shipment"
                      >
                        <Pencil size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(ship.id)}
                        className="p-2 hover:bg-rose-950/30 text-slate-400 hover:text-rose-500 rounded-lg transition-colors" 
                        title="Delete Shipment"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredShipments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-10 text-center text-xs font-bold text-slate-500">No shipments found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EditShipmentModal
        shipment={editingShipment}
        onClose={() => setEditingShipment(null)}
        onSaved={loadShipments}
      />

      <RecordShipmentPaymentModal
        shipment={paymentShipment}
        onClose={() => setPaymentShipment(null)}
        onSuccess={loadShipments}
      />
    </div>
  );
}
