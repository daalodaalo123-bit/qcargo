'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, DollarSign, Phone, CreditCard, Calendar, CheckCircle2, Loader2 } from 'lucide-react';

export interface PaymentQuotation {
  id: string;
  customer: string;
  phone?: string;
  goods: string;
  price: number;
  date: string;
  type: 'AIR' | 'SEA';
  amountPaid?: number;
  paymentStatus?: 'UNPAID' | 'PARTIAL' | 'PAID';
}

interface RecordPaymentModalProps {
  quote: PaymentQuotation | null;
  onClose: () => void;
  onSuccess: () => void;
}

const PAYMENT_METHODS = [
  { value: 'ZAAD', label: 'Zaad' },
  { value: 'EDAHAB', label: 'E-Dahab' },
  { value: 'WAAFI', label: 'Waafi' },
  { value: 'CASH', label: 'Cash' },
  { value: 'OTHER', label: 'Other' },
];

export default function RecordPaymentModal({ quote, onClose, onSuccess }: RecordPaymentModalProps) {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('ZAAD');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentType, setPaymentType] = useState<'FULL' | 'PARTIAL'>('FULL');
  const [partialAmount, setPartialAmount] = useState('');
  const [discountInput, setDiscountInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const discountApplied = Math.max(0, parseFloat(discountInput) || 0);
  const balanceDue = useMemo(() => {
    if (!quote) return 0;
    const paid = quote.amountPaid || 0;
    return Math.max(0, quote.price - paid);
  }, [quote]);
  const effectiveBalance = Math.max(0, balanceDue - discountApplied);

  useEffect(() => {
    if (quote) {
      setPhone(quote.phone || '');
      setStep(1);
      setError('');
      setPaymentMethod('ZAAD');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPaymentType('FULL');
      setDiscountInput('');
      const due = Math.max(0, quote.price - (quote.amountPaid || 0));
      setPartialAmount(due > 0 ? due.toFixed(2) : '');
    }
  }, [quote?.id, quote?.phone, quote?.price, quote?.amountPaid]);

  if (!quote) return null;

  const handleSubmit = async () => {
    if (!phone.trim()) {
      setError('Customer phone number is required');
      return;
    }
    const paidNow =
      paymentType === 'FULL' ? effectiveBalance : parseFloat(partialAmount) || 0;
    if (paidNow <= 0 && effectiveBalance > 0) {
      setError('Enter a valid payment amount');
      return;
    }
    if (paymentType === 'PARTIAL' && paidNow > effectiveBalance + 0.001) {
      setError(`Amount cannot exceed effective balance ($${effectiveBalance.toFixed(2)})`);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/quotations/record-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quotationId: quote.id,
          phone: phone.trim(),
          paymentMethod,
          paymentDate,
          paymentType,
          amountPaid: paymentType === 'PARTIAL' ? paidNow : undefined,
          discountAmount: discountApplied > 0 ? discountApplied : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.details || 'Failed to record payment');

      const statusLabel = data.invoice.paymentStatus === 'PAID' ? 'Paid in full' : 'Partial payment';
      const stepsDetail =
        Array.isArray(data.deliverySteps) && data.deliverySteps.length > 0
          ? '\n\n' +
            data.deliverySteps
              .map((s: { step: string; ok: boolean; detail?: string }) =>
                `${s.ok ? 'âœ“' : 'âœ—'} ${s.step}${s.detail ? `: ${s.detail}` : ''}`
              )
              .join('\n')
          : '';

      const whatsappNote = data.pdfSent
        ? 'PDF receipt attached on WhatsApp.'
        : data.whatsappSent
          ? 'WhatsApp sent text only (no PDF file).'
          : 'WhatsApp not yet configured — receipt saved to Accounting.';

      alert(
        `${statusLabel}!\n\nInvoice: ${data.invoice.invoiceNumber}\nPaid now: $${data.invoice.amountPaid.toFixed(2)}\n` +
          (data.invoice.balanceDue > 0
            ? `Balance remaining: $${data.invoice.balanceDue.toFixed(2)}\n`
            : '') +
          `Customer saved.\n\n${whatsappNote}${stepsDetail}`
      );
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md bg-[#131B2E] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0B0F19]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-950/40 text-emerald-400">
              <DollarSign size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-100 uppercase tracking-wider">Record Payment</h2>
              <p className="text-[10px] text-slate-500 font-bold">
                {quote.customer} Â· ${quote.price.toLocaleString()}
                {balanceDue < quote.price && (
                  <span className="text-amber-400"> Â· ${balanceDue.toFixed(2)} due</span>
                )}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-200 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-2 flex gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${step >= s ? 'bg-emerald-500' : 'bg-slate-800'}`}
            />
          ))}
        </div>

        <div className="p-6 space-y-5">
          {step === 1 && (
            <>
              <p className="text-sm text-slate-300">
                Record a payment for this quotation. You can mark it as{' '}
                <span className="text-emerald-400 font-bold">full</span> or{' '}
                <span className="text-amber-400 font-bold">partial</span> in the next step.
              </p>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1">
                <p className="text-slate-400">
                  <span className="font-bold text-slate-300">Goods:</span> {quote.goods}
                </p>
                <p className="text-slate-400">
                  <span className="font-bold text-slate-300">Total:</span> ${quote.price.toLocaleString()}
                </p>
                {(quote.amountPaid || 0) > 0 && (
                  <p className="text-slate-400">
                    <span className="font-bold text-slate-300">Already paid:</span> $
                    {(quote.amountPaid || 0).toLocaleString()}
                  </p>
                )}
                <p className="text-slate-400">
                  <span className="font-bold text-amber-400">Balance due:</span> ${balanceDue.toFixed(2)}
                </p>
                <p className="text-slate-400">
                  <span className="font-bold text-slate-300">Freight:</span> {quote.type}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={16} />
                Continue
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Customer Name</label>
                <input type="text" className="search-input opacity-70 cursor-not-allowed" value={quote.customer} readOnly />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">WhatsApp / Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="text"
                    className="search-input !pl-10"
                    placeholder="+252 63 ..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Saved to Customers CRM if new</p>
              </div>
              {error && <p className="text-xs text-rose-400 font-bold">{error}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 text-slate-400 text-xs font-bold uppercase">
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!phone.trim()) {
                      setError('Phone number is required');
                      return;
                    }
                    setError('');
                    setStep(3);
                  }}
                  className="flex-1 py-3 bg-[#F15D38] hover:bg-[#d64420] text-white rounded-xl font-black text-xs uppercase"
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              {/* Discount */}
              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/30">
                <label className="block text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2">
                  Apply Discount (optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 font-black text-sm">-$</span>
                  <input
                    type="number"
                    min={0}
                    max={balanceDue}
                    step="0.01"
                    className="search-input !pl-9 w-full !border-emerald-800/40 focus:!ring-emerald-500/40"
                    placeholder="0.00"
                    value={discountInput}
                    onChange={(e) => setDiscountInput(e.target.value)}
                  />
                </div>
                {discountApplied > 0 && (
                  <p className="text-[10px] text-emerald-400 font-bold mt-1.5">
                    Customer saves ${discountApplied.toFixed(2)} · Effective balance: ${effectiveBalance.toFixed(2)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Payment Amount</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentType('FULL');
                      setPartialAmount(effectiveBalance.toFixed(2));
                    }}
                    className={`py-3 rounded-xl text-xs font-black uppercase border transition-colors ${
                      paymentType === 'FULL'
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    Full (${effectiveBalance.toFixed(2)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentType('PARTIAL')}
                    className={`py-3 rounded-xl text-xs font-black uppercase border transition-colors ${
                      paymentType === 'PARTIAL'
                        ? 'bg-amber-600 border-amber-500 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    Partial
                  </button>
                </div>
              </div>

              {paymentType === 'PARTIAL' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">
                    Amount received now (USD)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input
                      type="number"
                      min={0.01}
                      max={effectiveBalance}
                      step="0.01"
                      className="search-input !pl-10 w-full"
                      placeholder="0.00"
                      value={partialAmount}
                      onChange={(e) => setPartialAmount(e.target.value)}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Max ${effectiveBalance.toFixed(2)} · After payment: $
                    {Math.max(0, effectiveBalance - (parseFloat(partialAmount) || 0)).toFixed(2)} remaining
                  </p>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Payment Method</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <select
                    className="search-input !pl-10 w-full"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Payment Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="date"
                    className="search-input !pl-10 w-full"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </div>
              </div>
              {error && <p className="text-xs text-rose-400 font-bold">{error}</p>}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 text-slate-400 text-xs font-bold uppercase"
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <DollarSign size={16} />}
                  {loading ? 'Processing...' : 'Create Receipt'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
