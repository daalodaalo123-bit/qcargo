'use client';

import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';

export interface ShipmentRow {
  id: string;
  shipmentNumber: string;
  customer: string;
  phone?: string;
  type: 'AIR' | 'SEA';
  status: 'ARRIVED' | 'IN_TRANSIT' | 'PENDING';
  payment: 'PAID' | 'UNPAID';
  total: number;
  batch: string;
  date: string;
  notes?: string;
}

interface EditShipmentModalProps {
  shipment: ShipmentRow | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditShipmentModal({ shipment, onClose, onSaved }: EditShipmentModalProps) {
  const [customer, setCustomer] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState<'AIR' | 'SEA'>('SEA');
  const [status, setStatus] = useState<'ARRIVED' | 'IN_TRANSIT' | 'PENDING'>('PENDING');
  const [payment, setPayment] = useState<'PAID' | 'UNPAID'>('UNPAID');
  const [total, setTotal] = useState('');
  const [batch, setBatch] = useState('UNASSIGNED');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [batches, setBatches] = useState<string[]>(['UNASSIGNED']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!shipment) return;
    setCustomer(shipment.customer);
    setPhone(shipment.phone || '');
    setType(shipment.type);
    setStatus(shipment.status);
    setPayment(shipment.payment);
    setTotal(String(shipment.total));
    setBatch(shipment.batch || 'UNASSIGNED');
    setDate(shipment.date);
    setNotes(shipment.notes || '');
    setError('');

    fetch('/api/batches')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const ids = ['UNASSIGNED', ...data.map((b: { batchId: string }) => b.batchId)];
        setBatches([...new Set(ids)]);
      })
      .catch(() => setBatches(['UNASSIGNED', shipment.batch].filter(Boolean)));
  }, [shipment]);

  if (!shipment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.trim()) {
      setError('Customer name is required');
      return;
    }
    if (!phone.trim()) {
      setError('Phone number is required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/shipments?id=${shipment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: customer.trim(),
          phone: phone.trim(),
          type,
          status,
          payment,
          total: parseFloat(total) || 0,
          batch,
          date,
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.details || 'Failed to update shipment');
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-[#131B2E] border border-slate-800 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 sticky top-0 bg-[#131B2E] z-10">
          <div>
            <h2 className="text-sm font-black text-slate-100 uppercase tracking-wider">Edit Shipment</h2>
            <p className="text-[10px] font-mono text-[#F15D38] mt-0.5">{shipment.shipmentNumber}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-200 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Customer</label>
            <input type="text" className="search-input w-full" value={customer} onChange={(e) => setCustomer(e.target.value)} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Phone</label>
            <input type="text" className="search-input w-full" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Freight Type</label>
              <select className="search-input w-full" value={type} onChange={(e) => setType(e.target.value as 'AIR' | 'SEA')}>
                <option value="AIR">Air</option>
                <option value="SEA">Sea</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status</label>
              <select
                className="search-input w-full"
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
              >
                <option value="PENDING">Pending</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="ARRIVED">Arrived</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Payment</label>
              <select
                className="search-input w-full"
                value={payment}
                onChange={(e) => setPayment(e.target.value as 'PAID' | 'UNPAID')}
              >
                <option value="UNPAID">Unpaid</option>
                <option value="PAID">Paid</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Total (USD)</label>
              <input
                type="number"
                step="0.01"
                min={0}
                className="search-input w-full"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Batch</label>
              <select className="search-input w-full" value={batch} onChange={(e) => setBatch(e.target.value)}>
                {batches.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Date</label>
              <input type="date" className="search-input w-full" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Notes</label>
            <textarea
              className="search-input w-full min-h-[72px] resize-y"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
            />
          </div>
          {error && <p className="text-xs text-rose-400 font-bold">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-slate-400 text-xs font-bold uppercase">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-[#F15D38] hover:bg-[#d64420] disabled:opacity-60 text-white rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
