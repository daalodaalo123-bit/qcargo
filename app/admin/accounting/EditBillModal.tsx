'use client';

import { useState } from 'react';
import { X, DollarSign, User } from 'lucide-react';

export interface EditableBill {
  id: string;
  vendor: string;
  amount: number;
  category: string;
  date: string;
  due: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  paymentMethod?: string;
  batchId?: string;
}

interface EditBillModalProps {
  bill: EditableBill;
  onClose: () => void;
  onSaved: (updated: EditableBill) => void;
}

export default function EditBillModal({ bill, onClose, onSaved }: EditBillModalProps) {
  const [vendor, setVendor] = useState(bill.vendor);
  const [amount, setAmount] = useState(String(bill.amount));
  const [category, setCategory] = useState(bill.category);
  const [date, setDate] = useState(bill.date);
  const [due, setDue] = useState(bill.due);
  const [status, setStatus] = useState(bill.status === 'OVERDUE' ? 'PENDING' : bill.status);
  const [paymentMethod, setPaymentMethod] = useState(bill.paymentMethod || 'CASH');
  const [batchId, setBatchId] = useState(bill.batchId || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        vendor: vendor.trim(),
        amount: parseFloat(amount) || 0,
        category: category.trim(),
        date,
        due,
        status,
        paymentMethod,
        batchId: batchId.trim() || 'GENERAL',
      };
      const res = await fetch(`/api/bills?id=${bill.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to update');
      onSaved({ ...bill, ...payload, status: status as EditableBill['status'] });
      onClose();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg shipment-card border border-slate-700 bg-[#131B2E] p-6 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-black text-slate-100 uppercase tracking-widest">Edit expense</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Vendor</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input className="search-input w-full !pl-9" value={vendor} onChange={(e) => setVendor(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Amount</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                <input type="number" className="search-input w-full !pl-9" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Batch ID</label>
              <input className="search-input w-full" value={batchId} onChange={(e) => setBatchId(e.target.value)} placeholder="FLT-2024-001" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Category</label>
            <input className="search-input w-full" value={category} onChange={(e) => setCategory(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Date</label>
              <input type="date" className="search-input w-full" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Due</label>
              <input type="date" className="search-input w-full" value={due} onChange={(e) => setDue(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Status</label>
              <select className="search-input w-full" value={status} onChange={(e) => setStatus(e.target.value as 'PAID' | 'PENDING')}>
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Paid via</label>
              <select className="search-input w-full" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="ZAAD">Zaad</option>
                <option value="EDAHAB">E-Dahab</option>
                <option value="WAAFI">Waafi</option>
                <option value="CASH">Cash</option>
                <option value="BANK">Bank</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-black uppercase text-slate-400">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn btn-primary text-xs">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
