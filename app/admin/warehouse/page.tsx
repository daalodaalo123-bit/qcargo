'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Search, Package, User, Hash, Scale, DollarSign, X, Loader2,
  Box, CheckCircle2, Clock, Truck, LogOut, Warehouse, AlertTriangle, RotateCcw
} from 'lucide-react';

interface ShipmentItem {
  description: string;
  qty: number;
  weight?: number;
  warehouseStatus?: 'IN_WAREHOUSE' | 'TAKEN' | 'LOST';
  statusDate?: string;
}

interface CourierPackage {
  trackingNumber: string;
  goods: string;
  qty: number;
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
  takenAt?: string;
}

type Filter = 'ALL' | 'ARRIVED' | 'IN_TRANSIT' | 'PENDING' | 'IN_WAREHOUSE' | 'TAKEN' | 'LOST';

const FILTERS: { value: Filter; label: string; icon: React.ElementType; color: string; active: string }[] = [
  { value: 'ALL',          label: 'All',         icon: Warehouse,    color: 'text-slate-400 border-slate-700 bg-slate-800',           active: 'text-slate-100 border-slate-500 bg-slate-700' },
  { value: 'ARRIVED',      label: 'Arrived',     icon: CheckCircle2, color: 'text-emerald-400 border-emerald-800/40 bg-emerald-950/20', active: 'text-white border-emerald-500 bg-emerald-600' },
  { value: 'IN_TRANSIT',   label: 'In Transit',  icon: Truck,        color: 'text-[#F15D38] border-[#F15D38]/30 bg-[#F15D38]/10',      active: 'text-white border-[#F15D38] bg-[#F15D38]' },
  { value: 'PENDING',      label: 'Pending',     icon: Clock,        color: 'text-amber-400 border-amber-800/40 bg-amber-950/20',      active: 'text-white border-amber-500 bg-amber-600' },
  { value: 'IN_WAREHOUSE', label: 'Still Here',  icon: Box,          color: 'text-blue-400 border-blue-800/40 bg-blue-950/20',         active: 'text-white border-blue-500 bg-blue-600' },
  { value: 'TAKEN',        label: 'Taken',       icon: LogOut,       color: 'text-purple-400 border-purple-800/40 bg-purple-950/20',   active: 'text-white border-purple-500 bg-purple-600' },
  { value: 'LOST',         label: 'Lost',        icon: AlertTriangle,color: 'text-rose-400 border-rose-800/40 bg-rose-950/20',         active: 'text-white border-rose-500 bg-rose-600' },
];

function formatDate(d?: string | Date) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return String(d); }
}

export default function WarehousePage() {
  const [shipments, setShipments] = useState<WarehouseShipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/shipments')
      .then(r => r.json())
      .then(data => setShipments(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // All items across all shipments for counting
  const allItems = useMemo(() =>
    shipments.flatMap(s => s.items.filter(it => it.description)),
  [shipments]);

  const counts: Record<Filter, number> = useMemo(() => ({
    ALL:          shipments.length,
    ARRIVED:      shipments.filter(s => s.status === 'ARRIVED').length,
    IN_TRANSIT:   shipments.filter(s => s.status === 'IN_TRANSIT').length,
    PENDING:      shipments.filter(s => s.status === 'PENDING').length,
    IN_WAREHOUSE: allItems.filter(it => !it.warehouseStatus || it.warehouseStatus === 'IN_WAREHOUSE').length,
    TAKEN:        allItems.filter(it => it.warehouseStatus === 'TAKEN').length,
    LOST:         allItems.filter(it => it.warehouseStatus === 'LOST').length,
  }), [shipments, allItems]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return shipments.filter(s => {
      // Status-based filters
      if (filter === 'ARRIVED' && s.status !== 'ARRIVED') return false;
      if (filter === 'IN_TRANSIT' && s.status !== 'IN_TRANSIT') return false;
      if (filter === 'PENDING' && s.status !== 'PENDING') return false;
      // Item-based filters: show shipment only if it has at least one matching item
      if (filter === 'IN_WAREHOUSE' && !s.items.some(it => !it.warehouseStatus || it.warehouseStatus === 'IN_WAREHOUSE')) return false;
      if (filter === 'TAKEN' && !s.items.some(it => it.warehouseStatus === 'TAKEN')) return false;
      if (filter === 'LOST' && !s.items.some(it => it.warehouseStatus === 'LOST')) return false;
      // Search
      if (!q) return true;
      if (s.shipmentNumber?.toLowerCase().includes(q)) return true;
      if (s.customer?.toLowerCase().includes(q)) return true;
      if (s.batch?.toLowerCase().includes(q)) return true;
      if (s.courierPackages?.some(p => p.trackingNumber?.toLowerCase().includes(q) || p.goods?.toLowerCase().includes(q))) return true;
      if (s.items?.some(it => it.description?.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [query, filter, shipments]);

  const matchedTracking = (s: WarehouseShipment) => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return s.courierPackages?.find(p => p.trackingNumber?.toLowerCase().includes(q));
  };

  const updateItemStatus = async (
    shipment: WarehouseShipment,
    itemIndex: number,
    newStatus: 'IN_WAREHOUSE' | 'TAKEN' | 'LOST'
  ) => {
    setUpdatingId(`${shipment._id}-${itemIndex}`);
    try {
      const updatedItems = shipment.items.map((it, i) =>
        i === itemIndex
          ? { ...it, warehouseStatus: newStatus, statusDate: newStatus === 'IN_WAREHOUSE' ? undefined : new Date().toISOString() }
          : it
      );
      const res = await fetch(`/api/shipments?id=${shipment._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updatedItems }),
      });
      if (!res.ok) throw new Error('Failed to update');
      setShipments(prev => prev.map(s =>
        s._id === shipment._id ? { ...s, items: updatedItems } : s
      ));
    } catch {
      alert('Update failed. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19]">
      {/* Search hero */}
      <div className="bg-[#131B2E] border-b border-slate-800 px-4 py-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#F15D38]/10 rounded-xl">
              <Warehouse size={22} className="text-[#F15D38]" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-100 tracking-tight">Inventory Lookup</h1>
              <p className="text-xs text-slate-500 font-medium">Search tracking number, customer, goods, or batch</p>
            </div>
          </div>

          <div className="relative mt-6">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={22} />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Tracking number, customer name, or batch…"
              className="w-full bg-[#0B0F19] border border-slate-700 rounded-2xl py-5 pl-14 pr-14 text-slate-100 text-lg font-medium placeholder:text-slate-600 focus:outline-none focus:border-[#F15D38] focus:ring-2 focus:ring-[#F15D38]/20 transition-all"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                <X size={20} />
              </button>
            )}
          </div>

          {/* Single unified filter row */}
          <div className="flex flex-wrap gap-2 mt-5 justify-center">
            {FILTERS.map(f => {
              const Icon = f.icon;
              const isActive = filter === f.value;
              return (
                <button key={f.value} onClick={() => setFilter(f.value)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-black uppercase tracking-wider transition-all ${isActive ? f.active : f.color} hover:opacity-90`}>
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
            <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">
              {query ? `No results for "${query}"` : 'No shipments match this filter'}
            </p>
          </div>
        )}

        {!loading && results.map(s => {
          const matched = matchedTracking(s);
          return (
            <div key={s._id} className={`bg-[#131B2E] border rounded-2xl overflow-hidden transition-all ${matched ? 'border-[#F15D38]/50 shadow-lg shadow-[#F15D38]/5' : 'border-slate-800'}`}>

              {/* Shipment header */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-800 bg-[#0B0F19]/60">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-xs font-black text-[#F15D38] bg-[#F15D38]/10 border border-[#F15D38]/20 px-2 py-1 rounded-lg">{s.shipmentNumber}</span>
                  <span className={`text-[10px] font-black px-2 py-1 rounded-lg border ${s.type === 'AIR' ? 'text-[#F15D38] bg-[#F15D38]/10 border-[#F15D38]/20' : 'text-emerald-400 bg-emerald-950/30 border-emerald-800/20'}`}>{s.type}</span>
                  <span className={`text-[10px] font-black px-2 py-1 rounded-lg border ${
                    s.status === 'ARRIVED' ? 'text-emerald-400 bg-emerald-950/30 border-emerald-800/20' :
                    s.status === 'IN_TRANSIT' ? 'text-[#F15D38] bg-[#F15D38]/10 border-[#F15D38]/20' :
                    'text-amber-400 bg-amber-950/30 border-amber-800/20'}`}>{s.status}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                  <span className="flex items-center gap-1.5 font-bold text-slate-300"><User size={13} />{s.customer}</span>
                  <span className="flex items-center gap-1.5"><Hash size={13} />{s.batch}</span>
                  <span className="flex items-center gap-1.5"><DollarSign size={13} /><span className="font-black text-slate-200">${s.total?.toFixed(2)}</span></span>
                  {s.weight ? <span className="flex items-center gap-1"><Scale size={12} />{s.weight}kg</span> : null}
                  {s.cbm ? <span className="flex items-center gap-1"><Box size={12} />{s.cbm}cbm</span> : null}
                </div>
              </div>

              {/* Tracking packages */}
              {s.courierPackages?.length > 0 && (
                <div className="px-6 pt-4 pb-2">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Tracking Numbers</p>
                  <div className="flex flex-wrap gap-2">
                    {s.courierPackages.map((pkg, i) => (
                      <div key={i} className={`px-3 py-2 rounded-xl border text-xs ${matched?.trackingNumber === pkg.trackingNumber ? 'bg-[#F15D38]/15 border-[#F15D38]/40 text-[#F15D38]' : 'bg-slate-900 border-slate-800 text-slate-300'}`}>
                        <span className="font-mono font-black">{pkg.trackingNumber}</span>
                        {pkg.goods && <span className="text-slate-500 ml-2">· {pkg.goods}</span>}
                        {pkg.qty > 1 && <span className="text-slate-500 ml-1">×{pkg.qty}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Items — each with individual status controls */}
              {s.items?.filter(it => it.description).length > 0 && (
                <div className="px-6 pt-3 pb-4">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Goods — Mark Each Item</p>
                  <div className="space-y-2">
                    {s.items.filter(it => it.description).map((item, rawIndex) => {
                      const itemIndex = s.items.indexOf(item);
                      const status = item.warehouseStatus || 'IN_WAREHOUSE';
                      const isUpdating = updatingId === `${s._id}-${itemIndex}`;

                      return (
                        <div key={rawIndex} className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-all ${
                          status === 'TAKEN' ? 'bg-purple-950/10 border-purple-800/30' :
                          status === 'LOST'  ? 'bg-rose-950/10 border-rose-800/30' :
                          'bg-slate-900/60 border-slate-800'
                        }`}>
                          {/* Item info */}
                          <div className="flex items-center gap-3 min-w-0">
                            <Package size={14} className={
                              status === 'TAKEN' ? 'text-purple-400 shrink-0' :
                              status === 'LOST'  ? 'text-rose-400 shrink-0' :
                              'text-slate-500 shrink-0'
                            } />
                            <div className="min-w-0">
                              <span className={`font-bold text-sm truncate block ${status === 'TAKEN' ? 'text-purple-300 line-through opacity-70' : status === 'LOST' ? 'text-rose-300 line-through opacity-70' : 'text-slate-200'}`}>
                                {item.description}
                              </span>
                              <span className="text-[10px] text-slate-500">Qty: {item.qty}</span>
                              {item.statusDate && status !== 'IN_WAREHOUSE' && (
                                <span className={`text-[10px] ml-2 font-bold ${status === 'TAKEN' ? 'text-purple-400' : 'text-rose-400'}`}>
                                  · {status === 'TAKEN' ? 'Taken' : 'Lost'} {formatDate(item.statusDate)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isUpdating ? (
                              <Loader2 size={16} className="animate-spin text-slate-400" />
                            ) : (
                              <>
                                {status !== 'IN_WAREHOUSE' && (
                                  <button
                                    onClick={() => updateItemStatus(s, itemIndex, 'IN_WAREHOUSE')}
                                    className="p-1.5 rounded-lg border bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
                                    title="Mark as back in inventory"
                                  >
                                    <RotateCcw size={13} />
                                  </button>
                                )}
                                {status !== 'TAKEN' && (
                                  <button
                                    onClick={() => updateItemStatus(s, itemIndex, 'TAKEN')}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[10px] font-black uppercase bg-slate-900 border-slate-700 text-slate-400 hover:bg-purple-950/30 hover:text-purple-400 hover:border-purple-800/40 transition-all"
                                    title="Mark as taken by customer"
                                  >
                                    <LogOut size={11} /> Taken
                                  </button>
                                )}
                                {status !== 'LOST' && (
                                  <button
                                    onClick={() => updateItemStatus(s, itemIndex, 'LOST')}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[10px] font-black uppercase bg-slate-900 border-slate-700 text-slate-400 hover:bg-rose-950/30 hover:text-rose-400 hover:border-rose-800/40 transition-all"
                                    title="Mark as lost"
                                  >
                                    <AlertTriangle size={11} /> Lost
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
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
