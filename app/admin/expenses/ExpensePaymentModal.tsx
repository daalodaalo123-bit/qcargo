'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, DollarSign, CreditCard, Calendar, CheckCircle2, Loader2 } from 'lucide-react';

export interface PayableExpense {
  id: string;
  vendor: string;
  category: string;
  amount: number;
  amountPaid: number;
  status: 'PAID' | 'PENDING' | 'PARTIAL';
  paymentMethod: string;
}

interface ExpensePaymentModalProps {
  expense: PayableExpense | null;
  onClose: () => void;
  onSuccess: (updated: PayableExpense) => void;
}

const PAYMENT_METHODS = [
  { value: 'ZAAD', label: 'Zaad' },
  { value: 'EDAHAB', label: 'E-Dahab' },
  { value: 'WAAFI', label: 'Waafi' },
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK', label: 'Bank Transfer' },
  { value: 'OTHER', label: 'Other' },
];

export default function ExpensePaymentModal({ expense, onClose, onSuccess }: ExpensePaymentModalProps) {
  const [paymentType, setPaymentType] = useState<'FULL' | 'PARTIAL'>('FULL');
  const [partialAmount, setPartialAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const balanceDue = useMemo(() => {
    if (!expense) return 0;
    return Math.max(0, expense.amount - (expense.amountPaid || 0));
  }, [expense]);

  useEffect(() => {
    if (expense) {
      setPaymentType('FULL');
      setPartialAmount(balanceDue > 0 ? balanceDue.toFixed(2) : '');
      setPaymentMethod(expense.paymentMethod || 'CASH');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setError('');
    }
  }, [expense?.id]);

  if (!expense) return null;

  const handleSubmit = async () => {
    const paying = paymentType === 'FULL' ? balanceDue : parseFloat(partialAmount) || 0;
    if (paying <= 0) { setError('Enter a valid amount'); return; }
    if (paymentType === 'PARTIAL' && paying > balanceDue + 0.001) {
      setError(`Cannot exceed balance due ($${balanceDue.toFixed(2)})`);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const newAmountPaid = (expense.amountPaid || 0) + paying;
      const isPaidFull = newAmountPaid >= expense.amount - 0.01;
      const newStatus = isPaidFull ? 'PAID' : 'PARTIAL';

      const res = await fetch(`/api/bills?id=${expense.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountPaid: newAmountPaid,
          status: newStatus,
          paymentMethod,
        }),
      });
      if (!res.ok) throw new Error('Failed to record payment');

      onSuccess({
        ...expense,
        amountPaid: newAmountPaid,
        status: newStatus as PayableExpense['status'],
        paymentMethod,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md bg-[#131B2E] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0B0F19]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-950/40 text-emerald-400">
              <DollarSign size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-100 uppercase tracking-wider">Record Payment</h2>
              <p className="text-[10px] text-slate-500 font-bold">{expense.vendor} · {expense.category}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-200 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Summary */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Total expense</span>
              <span className="font-black text-slate-100">${expense.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            {(expense.amountPaid || 0) > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-400">Already paid</span>
                <span className="font-bold text-emerald-400">${(expense.amountPaid || 0).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-800 pt-1.5 mt-1">
              <span className="font-bold text-amber-400">Balance due</span>
              <span className="font-black text-amber-400">${balanceDue.toFixed(2)}</span>
            </div>
          </div>

          {/* Pay full or partial */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Payment Amount</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button"
                onClick={() => { setPaymentType('FULL'); setPartialAmount(balanceDue.toFixed(2)); }}
                className={`py-3 rounded-xl text-xs font-black uppercase border transition-colors flex items-center justify-center gap-2 ${
                  paymentType === 'FULL' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600'
                }`}>
                <CheckCircle2 size={14} />
                Full (${balanceDue.toFixed(2)})
              </button>
              <button type="button"
                onClick={() => setPaymentType('PARTIAL')}
                className={`py-3 rounded-xl text-xs font-black uppercase border transition-colors ${
                  paymentType === 'PARTIAL' ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600'
                }`}>
                Partial
              </button>
            </div>
          </div>

          {paymentType === 'PARTIAL' && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Amount Paying Now (USD)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                <input
                  type="number" min={0.01} step="0.01" max={balanceDue}
                  className="search-input !pl-9 w-full"
                  placeholder="0.00"
                  value={partialAmount}
                  onChange={e => setPartialAmount(e.target.value)}
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Remaining after this payment: ${Math.max(0, balanceDue - (parseFloat(partialAmount) || 0)).toFixed(2)}
              </p>
            </div>
          )}

          {/* Payment method */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Paid Via</label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
              <select className="search-input !pl-9 w-full" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          </div>

          {/* Payment date */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Payment Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
              <input type="date" className="search-input !pl-9 w-full" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
            </div>
          </div>

          {error && <p className="text-xs text-rose-400 font-bold">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-slate-400 text-xs font-bold uppercase" disabled={loading}>Cancel</button>
            <button type="button" onClick={handleSubmit} disabled={loading}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2">
              {loading ? <Loader2 size={15} className="animate-spin" /> : <DollarSign size={15} />}
              {loading ? 'Saving...' : 'Record Payment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
