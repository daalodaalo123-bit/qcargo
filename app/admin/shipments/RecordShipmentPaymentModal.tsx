'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, DollarSign, Phone, CreditCard, Calendar, CheckCircle2, Loader2 } from 'lucide-react';

export interface PaymentShipment {
  id: string;
  shipmentNumber: string;
  customer: string;
  phone?: string;
  goods: string;
  total: number;
  date: string;
  type: 'AIR' | 'SEA';
  amountPaid?: number;
  paymentStatus?: 'UNPAID' | 'PARTIAL' | 'PAID';
}

interface RecordShipmentPaymentModalProps {
  shipment: PaymentShipment | null;
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

export default function RecordShipmentPaymentModal({
  shipment,
  onClose,
  onSuccess,
}: RecordShipmentPaymentModalProps) {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('ZAAD');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentType, setPaymentType] = useState<'FULL' | 'PARTIAL'>('FULL');
  const [partialAmount, setPartialAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const balanceDue = useMemo(() => {
    if (!shipment) return 0;
    const paid = shipment.amountPaid || 0;
    return Math.max(0, shipment.total - paid);
  }, [shipment]);

  useEffect(() => {
    if (shipment) {
      setPhone(shipment.phone || '');
      setStep(1);
      setError('');
      setPaymentMethod('ZAAD');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPaymentType('FULL');
      const due = Math.max(0, shipment.total - (shipment.amountPaid || 0));
      setPartialAmount(due > 0 ? due.toFixed(2) : '');
    }
  }, [shipment?.id, shipment?.phone, shipment?.total, shipment?.amountPaid]);

  if (!shipment) return null;

  const handleSubmit = async () => {
    if (!phone.trim()) {
      setError('Customer phone number is required');
      return;
    }
    const paidNow = paymentType === 'FULL' ? balanceDue : parseFloat(partialAmount) || 0;
    if (paidNow <= 0) {
      setError('Enter a valid payment amount');
      return;
    }
    if (paymentType === 'PARTIAL' && paidNow > balanceDue + 0.001) {
      setError(`Amount cannot exceed balance due ($${balanceDue.toFixed(2)})`);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/shipments/record-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipmentId: shipment.id,
          phone: phone.trim(),
          paymentMethod,
          paymentDate,
          paymentType,
          amountPaid: paymentType === 'PARTIAL' ? paidNow : undefined,
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
                `${s.ok ? '✓' : '✗'} ${s.step}${s.detail ? `: ${s.detail}` : ''}`
              )
              .join('\n')
          : '';

      const whatsappNote = data.pdfSent
        ? 'PDF receipt attached on WhatsApp.'
        : data.whatsappSent
          ? `WhatsApp message sent but NOT as PDF file.\n${data.whatsappError || 'Unknown error'}`
          : `WhatsApp failed: ${data.whatsappError || 'check WAWP + Cloudinary in .env.local'}`;

      alert(
        `${statusLabel}!\n\nInvoice: ${data.invoice.invoiceNumber}\nPaid now: $${data.invoice.amountPaid.toFixed(2)}\n` +
          (data.invoice.balanceDue > 0 ? `Balance remaining: $${data.invoice.balanceDue.toFixed(2)}\n` : '') +
          `Customer updated. Invoice saved to Accounting.\n\n${whatsappNote}${stepsDetail}`
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
                {shipment.shipmentNumber} · ${shipment.total.toLocaleString()}
                {balanceDue < shipment.total && (
                  <span className="text-amber-400"> · ${balanceDue.toFixed(2)} due</span>
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
                Record payment for this shipment. Choose{' '}
                <span className="text-emerald-400 font-bold">full</span> or{' '}
                <span className="text-amber-400 font-bold">partial</span> — we will create an invoice, send the PDF on
                WhatsApp, and list it under Accounting → Customer Invoices.
              </p>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1">
                <p className="text-slate-400">
                  <span className="font-bold text-slate-300">Customer:</span> {shipment.customer}
                </p>
                <p className="text-slate-400">
                  <span className="font-bold text-slate-300">Reference:</span> {shipment.shipmentNumber}
                </p>
                <p className="text-slate-400">
                  <span className="font-bold text-slate-300">Charges:</span> Freight, customs, tax & discount (on receipt)
                </p>
                <p className="text-slate-400">
                  <span className="font-bold text-slate-300">Total:</span> ${shipment.total.toLocaleString()}
                </p>
                {(shipment.amountPaid || 0) > 0 && (
                  <p className="text-slate-400">
                    <span className="font-bold text-slate-300">Already paid:</span> $
                    {(shipment.amountPaid || 0).toLocaleString()}
                  </p>
                )}
                <p className="text-slate-400">
                  <span className="font-bold text-amber-400">Balance due:</span> ${balanceDue.toFixed(2)}
                </p>
                <p className="text-slate-400">
                  <span className="font-bold text-slate-300">Freight:</span> {shipment.type}
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
                <input type="text" className="search-input opacity-70 cursor-not-allowed" value={shipment.customer} readOnly />
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
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Payment Amount</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentType('FULL');
                      setPartialAmount(balanceDue.toFixed(2));
                    }}
                    className={`py-3 rounded-xl text-xs font-black uppercase border transition-colors ${
                      paymentType === 'FULL'
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    Full (${balanceDue.toFixed(2)})
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
                      max={balanceDue}
                      step="0.01"
                      className="search-input !pl-10 w-full"
                      placeholder="0.00"
                      value={partialAmount}
                      onChange={(e) => setPartialAmount(e.target.value)}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Max ${balanceDue.toFixed(2)} · After payment: $
                    {Math.max(0, balanceDue - (parseFloat(partialAmount) || 0)).toFixed(2)} remaining
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
                  {loading ? 'Processing...' : 'Send Receipt'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
