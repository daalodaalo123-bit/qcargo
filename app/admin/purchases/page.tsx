'use client';

import { useState, useEffect } from 'react';
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
  Building2,
  Users,
  X,
  Loader2,
  Save,
} from 'lucide-react';
import Link from 'next/link';
import SuppliersTab from './SuppliersTab';

interface Order {
  id: string;
  orderNumber: string;
  customer: string;
  supplier: string;
  items: number;
  totalCNY?: number;
  exchangeRate?: number;
  totalUSD: number;
  paidUSD: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  status: 'IN_WAREHOUSE' | 'ORDERED' | 'SHIPPED';
  date: string;
}

type PurchaseTab = 'orders' | 'suppliers';

// Demo fallback data removed — real purchase orders come only from the database.

export default function PurchasesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<PurchaseTab>('orders');
  const [cnyRate, setCnyRate] = useState(7.1);

  // Record-payment modal state
  const [payingOrder, setPayingOrder] = useState<Order | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payMethod, setPayMethod] = useState('ALIPAY');
  const [paySaving, setPaySaving] = useState(false);

  // Load orders from MongoDB
  const loadOrders = async () => {
    try {
      const res = await fetch('/api/sourcing');
      if (!res.ok) throw new Error('Failed to load orders');
      const data = await res.json();
      setOrders(data.map((o: any) => ({
        ...o,
        id: o._id || o.id,
        items: Array.isArray(o.items) ? o.items.length : o.items
      })));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadOrders();
    fetch('/api/finance/settings').then(r => r.ok ? r.json() : null).then(s => { if (s?.rates?.CNY) setCnyRate(s.rates.CNY); }).catch(() => {});
  }, []);

  const recordSupplierPayment = async () => {
    if (!payingOrder) return;
    const amt = Number(payAmount);
    if (!amt || amt <= 0) { alert('Enter an amount greater than zero'); return; }
    setPaySaving(true);
    try {
      const res = await fetch(`/api/sourcing?id=${payingOrder.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordPayment: true, amountUSD: amt, date: payDate, method: payMethod }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Failed'); }
      setPayingOrder(null); setPayAmount('');
      await loadOrders();
    } catch (e: any) { alert(`Error: ${e.message}`); }
    finally { setPaySaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this procurement order?')) {
      try {
        const res = await fetch(`/api/sourcing?id=${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete order');
        setOrders(prev => prev.filter(o => o.id !== id));
        alert('Order deleted successfully!');
      } catch (err: any) {
        alert(`Error: ${err.message}`);
      }
    }
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Order Number,Customer,Supplier,Items,Total CNY,Total USD,Paid USD,Balance USD,Payment Status,Logistics Status,Date"].join(",") + "\n"
      + orders.map(o => `"${o.orderNumber}","${o.customer}","${o.supplier}",${o.items},${o.totalCNY||0},${o.totalUSD},${o.paidUSD},${(o.totalUSD-o.paidUSD).toFixed(2)},"${o.paymentStatus}","${o.status}","${o.date}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "qcargo_sourcing_orders.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredOrders = orders.filter(order => 
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculations
  const activeOrdersCount = orders.filter(o => o.status !== 'SHIPPED').length;
  const totalVolume = orders.reduce((acc, o) => acc + (o.totalUSD || 0), 0);
  const totalPaidSuppliers = orders.reduce((acc, o) => acc + (o.paidUSD || 0), 0);
  const stillToPay = orders.reduce((acc, o) => acc + Math.max(0, (o.totalUSD || 0) - (o.paidUSD || 0)), 0);
  const supplierCount = new Set(orders.map(o => (o.supplier || '').toLowerCase()).filter(Boolean)).size;
  const money = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

  return (
    <div className="admin-container">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight">Sourcing & Procurement</h1>
          <p className="text-slate-400 font-medium">Manage customer orders from international suppliers</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={handleExport}
            className="flex-1 md:flex-none btn bg-white border border-slate-800 text-slate-300 flex items-center justify-center gap-2 hover:bg-slate-800 shadow-sm"
          >
            <Download size={18} />
            Export Orders
          </button>
          <Link 
            href="/admin/purchases/new"
            className="flex-1 md:flex-none btn btn-primary flex items-center justify-center gap-2 shadow-lg shadow-[#F15D38]/20"
          >
            <Plus size={18} />
            New Sourcing
          </Link>
        </div>
      </div>

      {/* Tab toggle */}
      <div className="flex gap-2 mb-8 border-b border-slate-800">
        {(['orders', 'suppliers'] as PurchaseTab[]).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-5 py-3 text-sm font-bold border-b-2 -mb-px transition-colors flex items-center gap-2 ${activeTab === t ? 'border-[#F15D38] text-slate-100' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
            {t === 'orders' ? <ShoppingCart size={16} /> : <Building2 size={16} />}
            {t === 'orders' ? 'Orders' : 'Suppliers'}
          </button>
        ))}
      </div>

      {activeTab === 'suppliers' ? <SuppliersTab /> : (
      <>
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="shipment-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-xl bg-[#F15D38]/10 text-[#F15D38]">
              <ShoppingCart size={20} />
            </div>
            <span className="text-xs font-bold text-[#F15D38] bg-[#F15D38]/10 px-2 py-0.5 rounded-lg">Active</span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Open Orders</p>
          <h3 className="text-2xl font-black text-slate-100">{activeOrdersCount}</h3>
        </div>
        <div className="shipment-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-xl bg-emerald-950/30 text-emerald-400 border border-emerald-800/20">
              <DollarSign size={20} />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Purchasing Volume</p>
          <h3 className="text-2xl font-black text-slate-100">${(totalVolume / 1000).toFixed(1)}k</h3>
        </div>
        <div className="shipment-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-xl bg-amber-950/30 text-amber-400 border border-amber-800/20">
              <Clock size={20} />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Payment</p>
          <h3 className="text-2xl font-black text-slate-100">${stillToPay.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
        </div>
        <div className="shipment-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-xl bg-slate-900 text-slate-400 border border-slate-800">
              <Building2 size={20} />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Suppliers</p>
          <h3 className="text-2xl font-black text-slate-100">{supplierCount}</h3>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#F15D38] transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search Order #, Customer, or Supplier..." 
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

      {/* Purchases Table */}
      <div className="shipment-card !p-0 overflow-hidden border border-slate-800 shadow-xl shadow-slate-950/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/40 border-b border-slate-800">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Order / Date</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Customer & Supplier</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Logistics Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Payment</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Value</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-800/30 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-mono text-sm font-black text-slate-100">{order.orderNumber}</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase mt-0.5 tracking-wider">{order.date}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-100 text-xs">{order.customer}</span>
                      <span className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-1">
                        <Building2 size={10} className="text-[#F15D38]" /> {order.supplier}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-full ${
                      order.status === 'IN_WAREHOUSE' ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-800/20' : 
                      order.status === 'SHIPPED' ? 'bg-[#F15D38]/10 text-[#F15D38] border border-[#F15D38]/20' : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}>
                      {order.status === 'SHIPPED' ? <RefreshCcw size={12} className="animate-spin" /> : <Package size={12} />}
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded w-fit ${
                        order.paymentStatus === 'PAID' ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-800/20' : 'bg-rose-950/30 text-rose-400 border border-rose-800/20'
                      }`}>
                        {order.paymentStatus}
                      </span>
                      <span className="text-[9px] font-bold text-slate-500 mt-1">Paid: ${order.paidUSD.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-black text-slate-100">${order.totalUSD.toLocaleString()}</span>
                      {order.totalCNY ? <span className="text-[10px] font-bold text-emerald-400">¥{order.totalCNY.toLocaleString()} CNY</span> : null}
                      <span className="text-[10px] font-bold text-slate-500">{order.items} Units</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {order.paymentStatus !== 'PAID' && (
                        <button
                          onClick={() => { setPayingOrder(order); setPayAmount(''); setPayDate(new Date().toISOString().slice(0,10)); setPayMethod('ALIPAY'); }}
                          className="p-2 hover:bg-emerald-950/30 text-slate-400 hover:text-emerald-400 rounded-lg transition-colors"
                          title="Record supplier payment"
                        >
                          <DollarSign size={16} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(order.id)}
                        className="p-2 hover:bg-rose-950/30 text-slate-400 hover:text-rose-500 rounded-lg transition-colors" 
                        title="Delete Order"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-10 text-center text-xs font-bold text-slate-500">No sourcing orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* Record supplier payment modal */}
      {payingOrder && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0B0F19] border border-slate-800 rounded-3xl w-full max-w-md p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-black text-slate-100">Record Supplier Payment</h3>
              <button onClick={() => setPayingOrder(null)} className="p-2 text-slate-400 hover:text-slate-200 rounded-lg"><X size={18} /></button>
            </div>
            <p className="text-xs font-bold text-slate-500 mb-1">{payingOrder.orderNumber} · {payingOrder.supplier}</p>
            <p className="text-xs font-bold text-slate-400 mb-6">
              Total {money(payingOrder.totalUSD)} · Paid {money(payingOrder.paidUSD)} ·
              <span className="text-amber-400"> Balance {money(Math.max(0, payingOrder.totalUSD - payingOrder.paidUSD))}</span>
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Amount (USD)</label>
                <input type="number" autoFocus className="search-input w-full" placeholder="0.00"
                  value={payAmount} onChange={e => setPayAmount(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Date</label>
                  <input type="date" className="search-input w-full" value={payDate} onChange={e => setPayDate(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Method</label>
                  <select className="search-input w-full" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                    <option value="ALIPAY">AliPay</option>
                    <option value="ZAAD">Zaad</option>
                    <option value="EDAHAB">E-Dahab</option>
                    <option value="WAAFI">Waafi</option>
                    <option value="CASH">Cash</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button onClick={() => setPayingOrder(null)} className="btn bg-[#131B2E] border border-slate-800 text-slate-300 px-6">Cancel</button>
                <button onClick={recordSupplierPayment} disabled={paySaving} className="btn btn-primary px-8 flex items-center gap-2">
                  {paySaving && <Loader2 size={14} className="animate-spin" />} Record Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
