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
  Building2
} from 'lucide-react';
import Link from 'next/link';

interface Order {
  id: string;
  orderNumber: string;
  customer: string;
  supplier: string;
  items: number;
  totalUSD: number;
  paidUSD: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  status: 'IN_WAREHOUSE' | 'ORDERED' | 'SHIPPED';
  date: string;
}

const DEFAULT_ORDERS: Order[] = [
  { id: '1', orderNumber: 'PUR-2024-001', customer: 'Mustafe Ismail', supplier: 'Guangzhou Electronics Co.', items: 3, totalUSD: 1450.00, paidUSD: 1450.00, paymentStatus: 'PAID', status: 'IN_WAREHOUSE', date: '2026-05-10' },
  { id: '2', orderNumber: 'PUR-2024-002', customer: 'Sahra Hassan', supplier: 'Yiwu Fashion Hub', items: 1, totalUSD: 850.00, paidUSD: 400.00, paymentStatus: 'PARTIAL', status: 'ORDERED', date: '2026-05-18' },
  { id: '3', orderNumber: 'PUR-2024-003', customer: 'Ahmed Ali', supplier: 'Shenzhen Tech Ltd', items: 12, totalUSD: 5200.00, paidUSD: 5200.00, paymentStatus: 'PAID', status: 'SHIPPED', date: '2026-05-20' },
];

export default function PurchasesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);

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
  }, []);

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
      + ["Order Number,Customer,Supplier,Items Count,Total USD,Paid USD,Payment Status,Logistics Status,Date"].join(",") + "\n"
      + orders.map(o => `"${o.orderNumber}","${o.customer}","${o.supplier}",${o.items},${o.totalUSD},${o.paidUSD},"${o.paymentStatus}","${o.status}","${o.date}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "durdur_sourcing_orders.csv");
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
  const totalVolume = orders.reduce((acc, o) => acc + o.totalUSD, 0);
  const pendingPayment = orders.reduce((acc, o) => acc + (o.totalUSD - o.paidUSD), 0);

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
          <h3 className="text-2xl font-black text-slate-100">${pendingPayment.toLocaleString()}</h3>
        </div>
        <div className="shipment-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-xl bg-slate-900 text-slate-400 border border-slate-800">
              <Building2 size={20} />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Suppliers</p>
          <h3 className="text-2xl font-black text-slate-100">124</h3>
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
                      <span className="text-[10px] font-bold text-slate-500">{order.items} Units</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => alert('Editing order...')}
                        className="p-2 hover:bg-slate-800 text-slate-400 hover:text-slate-100 rounded-lg transition-colors" 
                        title="Edit Order"
                      >
                        <Pencil size={16} />
                      </button>
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
    </div>
  );
}
