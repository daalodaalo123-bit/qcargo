'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Package, User, Hash, Scale, DollarSign, X, Loader2, Box, CheckCircle2, Clock, Truck } from 'lucide-react';

interface ShipmentItem {
  description: string;
  qty: number;
  weight?: number;
  cbm?: number;
}

interface CourierPackage {
  trackingNumber: string;
  goods: string;
  qty: number;
  courier?: string;
}

interface WarehouseShipment {
  _id: string;
  shipmentNumber: string;
  customer: string;
  phone: string;
  type: 'AIR' | 'SEA';
  status: string;
  batch: string;
  total: number;
  weight?: number;
  cbm?: number;
  date: string;
  items: ShipmentItem[];
  courierPackages: CourierPackage[];
}

type StatusFilter = 'ALL' | 'ARRIVED' | 'IN_TRANSIT' | 'PENDING';

const STATUS_FILTERS: { value: StatusFilter; label: string; icon: React.ElementType; color: string; active: string }[] = [
  { value: 'ALL',        label: 'All',        icon: Package,      color: 'text-slate-400 border-slate-700 bg-slate-800',                            active: 'text-slate-100 border-slate-500 bg-slate-700' },
  { value: 'ARRIVED',   label: 'Arrived',    icon: CheckCircle2, color: 'text-emerald-400 border-emerald-800/40 bg-emerald-950/20',                 active: 'text-white border-emerald-500 bg-emerald-600' },
  { value: 'IN_TRANSIT',label: 'In Transit', icon: Truck,        color: 'text-[#F15D38] border-[#F15D38]/30 bg-[#F15D38]/10',                      active: 'text-white border-[#F15D38] bg-[#F15D38]' },
  { value: 'PENDING',   label: 'Pending',    icon: Clock,        color: 'text-amber-400 border-amber-800/40 bg-amber-950/20',                      active: 'text-white border-amber-500 bg-amber-600' },
];

export default function WarehousePage() {
  const [shipments, setShipments] = useState<WarehouseShipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  useEffect(() => {
    fetch('/api/shipments')
      .then(r => r.json())
      .then(data => setShipments(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => ({
    ALL:        shipments.length,
    ARRIVED:    shipments.filter(s => s.status === 'ARRIVED').length,
    IN_TRANSIT: shipments.filter(s => s.status === 'IN_TRANSIT').length,
    PENDING:    shipments.filter(s => s.status === 'PENDING').length,
  }), [shipments]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return shipments.filter(s => {
      if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
      if (!q) return true;
      if (s.shipmentNumber?.toLowerCase().includes(q)) return true;
      if (s.customer?.toLowerCase().includes(q)) return true;
      if (s.batch?.toLowerCase().includes(q)) return true;
      if (s.courierPackages?.some(p => p.trackingNumber?.toLowerCase().includes(q) || p.goods?.toLowerCase().includes(q))) return true;
      if (s.items?.some(it => it.description?.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [query, statusFilter, shipments]);

  // Highlight matching tracking number
  const matchedTracking = (s: WarehouseShipment) => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return s.courierPackages?.find(p => p.trackingNumber?.toLowerCase().includes(q));
  };

  return (
    <div className="min-h-screen bg-[#0B0F19]">
      {/* Top search hero */}
      <div className="bg-[#131B2E] border-b border-slate-800 px-4 py-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#F15D38]/10 rounded-xl">
              <Package size={22} className="text-[#F15D38]" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-100 tracking-tight">Warehouse Lookup</h1>
              <p className="text-xs text-slate-500 font-medium">Search by tracking number, customer, goods, or batch ID</p>
            </div>
          </div>
          <div className="relative mt-6">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={22} />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Type a tracking number, customer name, or batch…"
              className="w-full bg-[#0B0F19] border border-slate-700 rounded-2xl py-5 pl-14 pr-14 text-slate-100 text-lg font-medium placeholder:text-slate-600 focus:outline-none focus:border-[#F15D38] focus:ring-2 focus:ring-[#F15D38]/20 transition-all"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                <X size={20} />
              </button>
            )}
          </div>
          {/* Status filter pills */}
          <div className="flex flex-wrap gap-2 mt-5 justify-center">
            {STATUS_FILTERS.map(f => {
              const Icon = f.icon;
              const isActive = statusFilter === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-black uppercase tracking-wider transition-all ${isActive ? f.active : f.color} hover:opacity-90`}
                >
                  <Icon size={13} />
                  {f.label}
                  <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black ${isActive ? 'bg-white/20' : 'bg-slate-900/60'}`}>
                    {counts[f.value]}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-600 mt-3 font-medium text-center">
            {loading ? 'Loading…' : `${results.length} of ${shipments.length} shipments shown`}
          </p>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-[#F15D38]" />
          </div>
        )}

        {!loading && results.length === 0 && (
          <div className="text-center py-20">
            <Package size={48} className="mx-auto text-slate-700 mb-4" />
            <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">No results for "{query}"</p>
            <p className="text-slate-600 text-xs mt-1">Try the full tracking number or part of the customer name</p>
          </div>
        )}

        {!loading && results.map(s => {
          const matched = matchedTracking(s);
          return (
            <div key={s._id} className={`bg-[#131B2E] border rounded-2xl overflow-hidden transition-all ${matched ? 'border-[#F15D38]/50 shadow-lg shadow-[#F15D38]/5' : 'border-slate-800'}`}>
              {/* Shipment header */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-800 bg-[#0B0F19]/60">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-xs font-black text-[#F15D38] bg-[#F15D38]/10 border border-[#F15D38]/20 px-2 py-1 rounded-lg">
                    {s.shipmentNumber}
                  </span>
                  <span className={`text-[10px] font-black px-2 py-1 rounded-lg border ${
                    s.type === 'AIR' ? 'text-[#F15D38] bg-[#F15D38]/10 border-[#F15D38]/20' : 'text-emerald-400 bg-emerald-950/30 border-emerald-800/20'
                  }`}>
                    {s.type} FREIGHT
                  </span>
                  <span className={`text-[10px] font-black px-2 py-1 rounded-lg border ${
                    s.status === 'ARRIVED' ? 'text-emerald-400 bg-emerald-950/30 border-emerald-800/20' :
                    s.status === 'IN_TRANSIT' ? 'text-[#F15D38] bg-[#F15D38]/10 border-[#F15D38]/20' :
                    'text-amber-400 bg-amber-950/30 border-amber-800/20'
                  }`}>
                    {s.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                  <span className="flex items-center gap-1.5 font-bold text-slate-300">
                    <User size={13} /> {s.customer}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Hash size={13} /> {s.batch}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <DollarSign size={13} /> <span className="font-black text-slate-200">${s.total?.toFixed(2)}</span>
                  </span>
                  {s.weight ? <span className="flex items-center gap-1"><Scale size={12} /> {s.weight}kg</span> : null}
                  {s.cbm ? <span className="flex items-center gap-1"><Box size={12} /> {s.cbm}cbm</span> : null}
                </div>
              </div>

              {/* Tracking packages */}
              {s.courierPackages?.length > 0 && (
                <div className="px-6 pt-4 pb-2">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Tracking Numbers</p>
                  <div className="flex flex-wrap gap-2">
                    {s.courierPackages.map((pkg, i) => (
                      <div key={i} className={`px-3 py-2 rounded-xl border text-xs ${
                        matched?.trackingNumber === pkg.trackingNumber
                          ? 'bg-[#F15D38]/15 border-[#F15D38]/40 text-[#F15D38]'
                          : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}>
                        <span className="font-mono font-black">{pkg.trackingNumber}</span>
                        {pkg.goods && <span className="text-slate-500 ml-2">· {pkg.goods}</span>}
                        {pkg.qty > 1 && <span className="text-slate-500 ml-1">×{pkg.qty}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Goods items */}
              {s.items?.filter(it => it.description).length > 0 && (
                <div className="px-6 pt-3 pb-4">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Goods</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {s.items.filter(it => it.description).map((item, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-xs">
                        <Package size={12} className="text-slate-500 shrink-0" />
                        <span className="font-bold text-slate-200 truncate">{item.description}</span>
                        <span className="text-slate-500 shrink-0">×{item.qty}</span>
                        {item.weight ? <span className="text-slate-600 shrink-0">{item.weight}kg</span> : null}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
