'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, Ship, Plane, LogOut, Phone, MessageCircle, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface Shipment {
  _id: string;
  shipmentNumber: string;
  type: 'AIR' | 'SEA';
  status: 'PENDING' | 'IN_TRANSIT' | 'ARRIVED';
  date: string;
  total: number;
  paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID';
  batch: string;
  weight?: number;
  cbm?: number;
  items?: { description: string; qty: number; warehouseStatus?: 'IN_WAREHOUSE' | 'TAKEN' | 'LOST' }[];
}

interface Customer {
  name: string;
  phone: string;
  email?: string;
  currentBalance?: number;
  status?: string;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-slate-100 text-slate-600',
  IN_TRANSIT: 'bg-blue-50 text-blue-600',
  ARRIVED: 'bg-emerald-50 text-emerald-600',
};

const PAY_COLORS: Record<string, string> = {
  UNPAID: 'bg-rose-50 text-rose-600',
  PARTIAL: 'bg-amber-50 text-amber-600',
  PAID: 'bg-emerald-50 text-emerald-600',
};

const WAREHOUSE_COLORS: Record<string, string> = {
  IN_WAREHOUSE: 'bg-blue-50 text-blue-600',
  TAKEN: 'bg-emerald-50 text-emerald-600',
  LOST: 'bg-rose-50 text-rose-600',
};

const WAREHOUSE_LABELS: Record<string, string> = {
  IN_WAREHOUSE: 'In Warehouse',
  TAKEN: 'Collected',
  LOST: 'Lost',
};

export default function CustomerDashboardPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('customer_token');
    if (!token) { router.push('/customer'); return; }

    fetch('/api/customer/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(async res => {
        if (res.status === 401) { localStorage.removeItem('customer_token'); router.push('/customer'); return; }
        if (!res.ok) throw new Error('Failed to load data');
        const data = await res.json();
        setCustomer(data.customer);
        setShipments(data.shipments);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('customer_token');
    localStorage.removeItem('customer_name');
    router.push('/customer');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-bold">Loading your portal...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="text-center">
          <AlertCircle size={40} className="text-rose-400 mx-auto mb-4" />
          <p className="text-slate-600 font-bold mb-4">{error}</p>
          <button onClick={() => router.push('/customer')} className="btn btn-primary">Back to Login</button>
        </div>
      </div>
    );
  }

  const totalBalance = customer?.currentBalance || 0;

  return (
    <div className="min-h-screen bg-[#0B0F19] font-sans text-slate-100">
      {/* Nav */}
      <nav className="bg-[#0B0F19] border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-black tracking-tighter flex items-center gap-2">
            <img src="/logo-black.jpg" className="h-8 w-auto rounded-lg object-contain" alt="Q Cargo" />
            <span>Q<span className="text-blue-600">CARGO</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm font-bold text-slate-300">{customer?.name}</span>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-rose-400 transition-colors px-3 py-2 rounded-xl hover:bg-rose-950/30">
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Welcome + Balance */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="md:col-span-2 bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Welcome back</p>
            <h1 className="text-2xl font-black text-slate-900 mb-1">{customer?.name}</h1>
            <p className="text-sm text-slate-500 flex items-center gap-2">
              <Phone size={14} /> {customer?.phone}
            </p>
          </div>
          <div className={`rounded-[2rem] p-8 shadow-sm border ${totalBalance > 0 ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Balance Due</p>
            <p className={`text-3xl font-black ${totalBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              ${totalBalance.toLocaleString()}
            </p>
            {totalBalance > 0 && (
              <a href="https://wa.me/252638884835?text=I want to make a payment" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-rose-700 hover:underline">
                <MessageCircle size={12} /> Pay via WhatsApp
              </a>
            )}
          </div>
        </div>

        {/* Shipments */}
        <div>
          <h2 className="text-lg font-black text-slate-100 mb-6">Your Shipments ({shipments.length})</h2>

          {shipments.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-12 text-center border border-slate-100">
              <Package size={40} className="text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-bold">No shipments found.</p>
              <a href="https://wa.me/252638884837" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 text-xs font-bold text-blue-600 hover:underline">
                <MessageCircle size={14} /> Contact us to start shipping
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {shipments.map(s => (
                <div key={s._id} className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.type === 'SEA' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                        {s.type === 'SEA' ? <Ship size={22} /> : <Plane size={22} />}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-base font-mono">{s.shipmentNumber}</p>
                        <p className="text-xs text-slate-400 font-bold mt-0.5">
                          {s.date} · {s.items?.length ? `${s.items.length} item${s.items.length !== 1 ? 's' : ''}` : 'Cargo shipment'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[s.status] || 'bg-slate-100 text-slate-500'}`}>
                        {s.status.replace('_', ' ')}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${PAY_COLORS[s.paymentStatus] || 'bg-slate-100 text-slate-500'}`}>
                        {s.paymentStatus}
                      </span>
                      <span className="text-sm font-black text-slate-900">${s.total}</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4 flex items-center gap-3">
                    {['PENDING', 'IN_TRANSIT', 'ARRIVED'].map((st, i) => (
                      <div key={st} className="flex items-center gap-2 flex-1">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 ${
                          ['PENDING', 'IN_TRANSIT', 'ARRIVED'].indexOf(s.status) >= i
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          {['PENDING', 'IN_TRANSIT', 'ARRIVED'].indexOf(s.status) > i
                            ? <CheckCircle2 size={12} />
                            : <span>{i + 1}</span>
                          }
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 hidden sm:block">{st.replace('_', ' ')}</span>
                        {i < 2 && <div className="flex-1 h-0.5 bg-slate-100 hidden sm:block" />}
                      </div>
                    ))}
                  </div>

                  {/* Itemized goods with per-item status */}
                  {s.items && s.items.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Your Goods</p>
                      <div className="space-y-2">
                        {s.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-3 bg-slate-50 rounded-xl px-4 py-2.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <Package size={14} className="text-slate-400 shrink-0" />
                              <span className="text-sm font-bold text-slate-700 truncate">{item.description}</span>
                              <span className="text-xs text-slate-400 font-bold shrink-0">× {item.qty}</span>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 ${WAREHOUSE_COLORS[item.warehouseStatus || 'IN_WAREHOUSE']}`}>
                              {WAREHOUSE_LABELS[item.warehouseStatus || 'IN_WAREHOUSE']}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-[10px] text-slate-400 font-bold">
                      {s.type === 'AIR' ? `${s.weight || 0} KG` : `${s.cbm || 0} CBM`}
                      {s.batch && s.batch !== 'UNASSIGNED' ? ` · Batch: ${s.batch}` : ''}
                    </p>
                    <Link href={`/tracking?q=${s.shipmentNumber}`}
                      className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1">
                      Track this shipment →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Support */}
        <div className="mt-10 bg-slate-900 rounded-[2rem] p-8 text-white">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Need Help?</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a href="https://wa.me/252638884835" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-bold text-sm transition-colors">
              <MessageCircle size={18} /> WhatsApp Support
            </a>
            <a href="/tracking" className="flex items-center gap-3 bg-white/10 hover:bg-white/20 text-white px-5 py-3 rounded-xl font-bold text-sm transition-colors">
              <Package size={18} /> Track a Shipment
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
