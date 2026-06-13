'use client';

import { useState, useEffect } from 'react';
import { X, User, Phone, MapPin, Loader2, FileText, Ship, Receipt, Wallet } from 'lucide-react';

interface QuotationRow {
  _id: string;
  goods: string;
  type: 'AIR' | 'SEA';
  status: 'SENT' | 'DRAFT' | 'APPROVED' | 'REJECTED';
  paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID';
  price: number;
  amountPaid: number;
  date: string;
}

interface ShipmentRow {
  _id: string;
  shipmentNumber: string;
  type: 'AIR' | 'SEA';
  status: 'PENDING' | 'IN_TRANSIT' | 'ARRIVED';
  paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID';
  total: number;
  amountPaid: number;
  batch: string;
  date: string;
}

interface InvoiceRow {
  _id: string;
  invoiceNumber: string;
  totalAmount: number;
  amountPaid: number;
  paymentMethod: string;
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  paymentDate: string;
}

interface HistoryData {
  customer: {
    name: string;
    phone: string;
    city?: string;
    status?: string;
  };
  quotations: QuotationRow[];
  shipments: ShipmentRow[];
  invoices: InvoiceRow[];
  summary: {
    totalQuotations: number;
    totalShipments: number;
    totalQuoted: number;
    totalShipped: number;
    totalPaid: number;
    balanceDue: number;
  };
}

interface CustomerHistoryModalProps {
  customerId: string | null;
  onClose: () => void;
}

const STATUS_STYLES: Record<string, string> = {
  APPROVED: 'bg-emerald-950/30 text-emerald-400 border border-emerald-800/20',
  SENT: 'bg-[#F15D38]/15 text-[#F15D38] border border-[#F15D38]/20',
  REJECTED: 'bg-rose-950/30 text-rose-400 border border-rose-800/20',
  DRAFT: 'bg-slate-900 text-slate-400 border border-slate-800',
  PENDING: 'bg-amber-950/30 text-amber-400 border border-amber-800/20',
  IN_TRANSIT: 'bg-blue-950/30 text-blue-400 border border-blue-800/20',
  ARRIVED: 'bg-emerald-950/30 text-emerald-400 border border-emerald-800/20',
  PAID: 'bg-emerald-950/30 text-emerald-400 border border-emerald-800/20',
  PARTIAL: 'bg-amber-950/30 text-amber-400 border border-amber-800/20',
  UNPAID: 'bg-rose-950/30 text-rose-400 border border-rose-800/20',
};

export default function CustomerHistoryModal({ customerId, onClose }: CustomerHistoryModalProps) {
  const [data, setData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!customerId) return;
    setLoading(true);
    setData(null);
    fetch(`/api/customers/${customerId}/history`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [customerId]);

  if (!customerId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-4xl bg-[#131B2E] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0B0F19]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#F15D38]/10 text-[#F15D38]">
              <User size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-100 uppercase tracking-wider">Customer History</h2>
              {data && <p className="text-[10px] text-slate-500 font-bold">{data.customer.name}</p>}
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-200 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-[#F15D38]" />
          </div>
        ) : !data ? (
          <div className="p-10 text-center text-sm text-slate-400 font-bold">Failed to load customer history.</div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Contact info */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-slate-300">
                <Phone size={14} className="text-slate-500" />
                <span className="text-xs font-bold">{data.customer.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <MapPin size={14} className="text-slate-500" />
                <span className="text-xs font-bold">{data.customer.city || 'Hargeisa'}</span>
              </div>
              {data.customer.status && (
                <span className={`text-[10px] font-black px-3 py-1 rounded-full ${
                  data.customer.status === 'VIP' ? 'bg-amber-950/30 text-amber-400 border border-amber-800/20' : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}>
                  {data.customer.status}
                </span>
              )}
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-[#0B0F19] border border-slate-800">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Quotations</p>
                <p className="text-xl font-black text-slate-100">{data.summary.totalQuotations}</p>
              </div>
              <div className="p-4 rounded-xl bg-[#0B0F19] border border-slate-800">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Shipments</p>
                <p className="text-xl font-black text-slate-100">{data.summary.totalShipments}</p>
              </div>
              <div className="p-4 rounded-xl bg-[#0B0F19] border border-slate-800">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Paid</p>
                <p className="text-xl font-black text-emerald-400">${data.summary.totalPaid.toFixed(2)}</p>
              </div>
              <div className="p-4 rounded-xl bg-[#0B0F19] border border-slate-800">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Balance Due</p>
                <p className={`text-xl font-black ${data.summary.balanceDue > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  ${data.summary.balanceDue.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Quotations */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText size={14} className="text-[#F15D38]" />
                <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider">Quotations ({data.quotations.length})</h3>
              </div>
              {data.quotations.length === 0 ? (
                <p className="text-xs text-slate-500 font-bold px-2">No quotations on record.</p>
              ) : (
                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-900/60 border-b border-slate-800">
                        <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Goods</th>
                        <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Status</th>
                        <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Payment</th>
                        <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {data.quotations.map((q) => (
                        <tr key={q._id}>
                          <td className="px-4 py-2.5 text-xs font-bold text-slate-400">{q.date}</td>
                          <td className="px-4 py-2.5 text-xs font-bold text-slate-200">{q.goods}</td>
                          <td className="px-4 py-2.5 text-center">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${STATUS_STYLES[q.status] || STATUS_STYLES.DRAFT}`}>{q.status}</span>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${STATUS_STYLES[q.paymentStatus] || STATUS_STYLES.UNPAID}`}>{q.paymentStatus}</span>
                          </td>
                          <td className="px-4 py-2.5 text-right text-xs font-black text-slate-100">${q.price.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Shipments */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Ship size={14} className="text-[#F15D38]" />
                <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider">Shipments ({data.shipments.length})</h3>
              </div>
              {data.shipments.length === 0 ? (
                <p className="text-xs text-slate-500 font-bold px-2">No shipments on record.</p>
              ) : (
                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-900/60 border-b border-slate-800">
                        <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Shipment #</th>
                        <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Batch</th>
                        <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Status</th>
                        <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Payment</th>
                        <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {data.shipments.map((s) => (
                        <tr key={s._id}>
                          <td className="px-4 py-2.5 text-xs font-black text-slate-100 font-mono">{s.shipmentNumber}</td>
                          <td className="px-4 py-2.5 text-xs font-bold text-slate-400">{s.date}</td>
                          <td className="px-4 py-2.5 text-xs font-bold text-slate-400">{s.batch}</td>
                          <td className="px-4 py-2.5 text-center">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${STATUS_STYLES[s.status] || STATUS_STYLES.PENDING}`}>{s.status}</span>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${STATUS_STYLES[s.paymentStatus] || STATUS_STYLES.UNPAID}`}>{s.paymentStatus}</span>
                          </td>
                          <td className="px-4 py-2.5 text-right text-xs font-black text-slate-100">${(s.total || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Payment history */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Wallet size={14} className="text-[#F15D38]" />
                <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider">Payment History ({data.invoices.length})</h3>
              </div>
              {data.invoices.length === 0 ? (
                <p className="text-xs text-slate-500 font-bold px-2">No payments recorded yet.</p>
              ) : (
                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-900/60 border-b border-slate-800">
                        <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Receipt #</th>
                        <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Method</th>
                        <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Status</th>
                        <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Amount Paid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {data.invoices.map((inv) => (
                        <tr key={inv._id}>
                          <td className="px-4 py-2.5 text-xs font-black text-slate-100 font-mono">
                            <span className="inline-flex items-center gap-1.5"><Receipt size={12} className="text-slate-500" />{inv.invoiceNumber}</span>
                          </td>
                          <td className="px-4 py-2.5 text-xs font-bold text-slate-400">{inv.paymentDate}</td>
                          <td className="px-4 py-2.5 text-xs font-bold text-slate-300">{inv.paymentMethod}</td>
                          <td className="px-4 py-2.5 text-center">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${STATUS_STYLES[inv.paymentStatus] || STATUS_STYLES.UNPAID}`}>{inv.paymentStatus}</span>
                          </td>
                          <td className="px-4 py-2.5 text-right text-xs font-black text-emerald-400">${(inv.amountPaid || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
