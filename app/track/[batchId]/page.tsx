'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { Package, Check, Clock, Plane, Ship, RefreshCw } from 'lucide-react';

interface TrackLine {
  lineType: 'item' | 'courier' | 'none';
  index: number;
  product: string;
  qty: number;
  tracking: string;
  received: boolean;
}
interface TrackCustomer {
  shipmentId: string;
  customer: string;
  weightLabel: string;
  type: 'AIR' | 'SEA';
  lines: TrackLine[];
}
interface TrackData {
  batchId: string;
  type: 'AIR' | 'SEA';
  origin: string;
  destination: string;
  status: string;
  totalLines: number;
  receivedCount: number;
  customers: TrackCustomer[];
}

export default function BatchTrackPage({ params }: { params: Promise<{ batchId: string }> | { batchId: string } }) {
  const resolved = params && 'then' in params ? use(params) : params;
  const batchId = resolved?.batchId;

  const [data, setData] = useState<TrackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/track/${batchId}`);
      if (!res.ok) throw new Error('Could not load this batch');
      setData(await res.json());
      setError('');
    } catch (e: any) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => { if (batchId) load(); }, [batchId, load]);

  const toggle = async (c: TrackCustomer, line: TrackLine) => {
    if (line.lineType === 'none' || !data) return;
    const key = `${c.shipmentId}-${line.lineType}-${line.index}`;
    const next = !line.received;
    setSavingKey(key);

    // optimistic update
    setData((prev) => {
      if (!prev) return prev;
      const customers = prev.customers.map((cc) =>
        cc.shipmentId !== c.shipmentId ? cc : {
          ...cc,
          lines: cc.lines.map((l) => (l.lineType === line.lineType && l.index === line.index ? { ...l, received: next } : l)),
        }
      );
      const receivedCount = customers.reduce((sum, cc) => sum + cc.lines.filter((l) => l.received).length, 0);
      return { ...prev, customers, receivedCount };
    });

    try {
      const res = await fetch(`/api/track/${batchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipmentId: c.shipmentId, lineType: line.lineType, index: line.index, received: next }),
      });
      if (!res.ok) throw new Error('save failed');
    } catch {
      await load(); // revert to server truth on failure
      alert('Could not save — please try again.');
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
        <RefreshCw className="text-[#F15D38] animate-spin" size={28} />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-6">
        <div className="text-center">
          <Package className="text-slate-600 mx-auto mb-3" size={32} />
          <p className="text-slate-300 font-bold">{error || 'Batch not found'}</p>
        </div>
      </div>
    );
  }

  const pct = data.totalLines > 0 ? Math.round((data.receivedCount / data.totalLines) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 pb-16">
      {/* Header */}
      <div className="bg-[#131B2E] border-b border-slate-800 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#F15D38]/10 text-[#F15D38]">
                {data.type === 'AIR' ? <Plane size={18} /> : <Ship size={18} />}
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight">Q CARGO</h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Arrival Checklist</p>
              </div>
            </div>
            <button onClick={load} className="p-2 text-slate-400 hover:text-slate-100" title="Refresh">
              <RefreshCw size={16} />
            </button>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-black text-slate-200">Batch {data.batchId}</span>
              <span className="font-bold text-slate-400">{data.origin} → {data.destination}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs font-black text-emerald-400 shrink-0">{data.receivedCount}/{data.totalLines} arrived</span>
            </div>
          </div>
        </div>
      </div>

      {/* Customers */}
      <div className="max-w-2xl mx-auto px-5 py-5 space-y-5">
        {data.customers.length === 0 && (
          <p className="text-center text-slate-500 font-bold py-10">No customers in this batch yet.</p>
        )}
        {data.customers.map((c) => (
          <div key={c.shipmentId} className="bg-[#131B2E] border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 bg-[#0B0F19]/60 border-b border-slate-800 flex items-center justify-between">
              <h2 className="font-black text-slate-100">{c.customer}</h2>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{c.weightLabel}</span>
            </div>
            <div className="divide-y divide-slate-800/60">
              {c.lines.map((line) => {
                const key = `${c.shipmentId}-${line.lineType}-${line.index}`;
                const saving = savingKey === key;
                return (
                  <div key={key} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-slate-200 truncate">{line.product}</p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Qty: {line.qty}{line.tracking ? ` · ${line.tracking}` : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => toggle(c, line)}
                      disabled={saving || line.lineType === 'none'}
                      className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11px] font-black uppercase tracking-wider border transition-colors disabled:opacity-60 ${
                        line.received
                          ? 'bg-emerald-500 text-white border-emerald-500'
                          : 'bg-transparent text-slate-300 border-slate-600 hover:border-[#F15D38] hover:text-[#F15D38]'
                      }`}
                    >
                      {line.received ? <Check size={13} /> : <Clock size={13} />}
                      {line.received ? 'Received' : 'Not yet'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-[10px] text-slate-600 font-bold mt-4">
        Tap a button to mark goods as received. Changes save automatically.
      </p>
    </div>
  );
}
