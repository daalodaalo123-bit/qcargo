'use client';

import { useState, useEffect } from 'react';
import { X, User, Phone, Calendar, Package, Loader2, Ship, Plane, Download } from 'lucide-react';

interface PreviewItem {
  description: string;
  notes?: string;
  qty: number;
  price: number;
}

interface PreviewData {
  _id: string;
  customer: string;
  phone?: string;
  goods: string;
  price: number;
  date: string;
  status: 'SENT' | 'DRAFT' | 'APPROVED' | 'REJECTED';
  paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID';
  amountPaid: number;
  type: 'AIR' | 'SEA';
  items: PreviewItem[];
  commissionRate: number;
  commissionAmount: number;
}

interface QuotationPreviewModalProps {
  quotationId: string | null;
  onClose: () => void;
}

const STATUS_STYLES: Record<string, string> = {
  APPROVED: 'bg-emerald-950/30 text-emerald-400 border border-emerald-800/20',
  SENT: 'bg-[#F15D38]/15 text-[#F15D38] border border-[#F15D38]/20',
  REJECTED: 'bg-rose-950/30 text-rose-400 border border-rose-800/20',
  DRAFT: 'bg-slate-900 text-slate-400 border border-slate-800',
};

export default function QuotationPreviewModal({ quotationId, onClose }: QuotationPreviewModalProps) {
  const [data, setData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!quotationId) return;
    setLoading(true);
    setData(null);
    fetch(`/api/quotations/${quotationId}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [quotationId]);

  if (!quotationId) return null;

  const items = data?.items || [];
  const subtotal = items.reduce((acc, it) => acc + (it.qty || 0) * (it.price || 0), 0) || (data ? data.price - (data.commissionAmount || 0) : 0);
  const commissionRate = data?.commissionRate || 0;
  const commissionAmount = data?.commissionAmount || 0;
  const total = data?.price ?? subtotal + commissionAmount;
  const balanceDue = data ? Math.max(0, data.price - (data.amountPaid || 0)) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-[#131B2E] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0B0F19]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#F15D38]/10 text-[#F15D38]">
              <Package size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-100 uppercase tracking-wider">Quotation Preview</h2>
              {data && <p className="text-[10px] text-slate-500 font-bold">{data.customer}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {data && (
              <a
                href={`/api/quotations/${quotationId}/pdf`}
                download
                className="p-2 hover:bg-slate-800 text-slate-400 hover:text-slate-100 rounded-lg transition-colors"
                title="Download PDF"
              >
                <Download size={16} />
              </a>
            )}
            <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-200 rounded-lg">
              <X size={18} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-[#F15D38]" />
          </div>
        ) : !data ? (
          <div className="p-10 text-center text-sm text-slate-400 font-bold">Failed to load quotation.</div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Top info */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-slate-300">
                  <User size={14} className="text-slate-500" />
                  <span className="font-bold text-sm">{data.customer}</span>
                </div>
                {data.phone && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Phone size={14} className="text-slate-500" />
                    <span className="text-xs font-bold">{data.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-400">
                  <Calendar size={14} className="text-slate-500" />
                  <span className="text-xs font-bold">{data.date}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-full ${STATUS_STYLES[data.status] || STATUS_STYLES.DRAFT}`}>
                  {data.status}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-full bg-slate-900 text-slate-300 border border-slate-800">
                  {data.type === 'SEA' ? <Ship size={12} /> : <Plane size={12} />}
                  {data.type} FREIGHT
                </span>
              </div>
            </div>

            {/* Items table */}
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-800">
                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Item</th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Qty</th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Price</th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {items.length > 0 ? (
                    items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3">
                          <p className="text-sm font-bold text-slate-200">{it.description}</p>
                          {it.notes && <p className="text-xs text-slate-500 mt-0.5">{it.notes}</p>}
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-300">{it.qty}</td>
                        <td className="px-4 py-3 text-right text-sm font-bold text-slate-300">${it.price.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-sm font-black text-slate-100">${(it.qty * it.price).toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-xs font-bold text-slate-500">{data.goods}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-full max-w-xs space-y-2 p-4 rounded-xl bg-[#0B0F19] border border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-bold text-slate-300">${subtotal.toFixed(2)}</span>
                </div>
                {commissionAmount > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Commission ({commissionRate}%)</span>
                    <span className="font-bold text-[#F15D38]">+${commissionAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-slate-800 pt-2">
                  <span className="text-xs font-black text-slate-300 uppercase tracking-wider">Total</span>
                  <span className="font-black text-slate-100 text-base">${total.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500">Paid</span>
                  <span className="font-bold text-emerald-400">${(data.amountPaid || 0).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Balance Due</span>
                  <span className={`font-bold ${balanceDue > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>${balanceDue.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
