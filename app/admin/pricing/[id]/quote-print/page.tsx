'use client';

import { useState, useEffect, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const CURRENCY_RATES: Record<string, number> = { USD: 1, CNY: 0.138, AED: 0.272 };

export default function QuotePrintPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = params && 'then' in params ? use(params) : params;
  const id = resolvedParams?.id;
  const sp = useSearchParams();
  const respId = sp.get('resp') || '';
  const margin = parseFloat(sp.get('margin') || '15');
  const shipping = parseFloat(sp.get('shipping') || '0');

  const [request, setRequest]   = useState<any>(null);
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/pricing/requests/${id}`).then(r => r.json()),
      fetch(`/api/pricing/responses?requestId=${id}`).then(r => r.json()),
    ]).then(([req, responses]) => {
      setRequest(req);
      if (Array.isArray(responses)) {
        const r = responses.find((x: any) => x._id === respId) || responses[0];
        setResponse(r || null);
      }
    }).finally(() => setLoading(false));
  }, [id, respId]);

  if (loading) return <div className="p-10 text-slate-400 font-bold">Loading...</div>;
  if (!request || !response) return <div className="p-10 text-rose-400 font-bold">Quote data not found.</div>;

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const quoteNumber = `QUO-${request.requestNumber}-${new Date().getFullYear()}`;
  const unitUSD = response.unitPrice * (CURRENCY_RATES[response.currency] || 1);
  const totalCost = unitUSD * request.quantity;
  const marginAmt = totalCost * (margin / 100);
  const grand = totalCost + marginAmt + shipping;
  const unitQuote = grand / request.quantity;

  return (
    <>
      <div className="no-print flex items-center gap-4 bg-[#0B0F19] border-b border-slate-800 px-6 py-3">
        <Link href={`/admin/pricing/${id}`} className="flex items-center gap-2 text-slate-400 hover:text-slate-100 text-xs font-bold uppercase tracking-wider transition-colors">
          <ArrowLeft size={14} /> Back
        </Link>
        <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Sourcing Quote — {request.requestNumber}</span>
        <button onClick={() => window.print()} className="ml-auto flex items-center gap-2 bg-[#F15D38] hover:bg-[#d64420] text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors">
          <Printer size={14} /> Print / Save PDF
        </button>
      </div>

      <div className="print-doc bg-white text-black min-h-screen p-10 font-sans max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start pb-6 mb-8 border-b-[3px] border-black">
          <div>
            <div className="text-2xl font-black tracking-tight text-black uppercase">Q Cargo Logistics</div>
            <div className="text-sm text-gray-500 mt-1">Hargeisa, Somaliland</div>
            <div className="text-sm text-gray-500">qcargologistic@gmail.com</div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black uppercase tracking-widest text-black">Sourcing Quote</div>
            <div className="text-xs text-gray-500 mt-1 font-bold uppercase tracking-widest">Quote No: {quoteNumber}</div>
            <div className="text-xs text-gray-500 mt-0.5">Date: {today}</div>
          </div>
        </div>

        {/* Customer & Product */}
        <div className="grid grid-cols-2 gap-px bg-gray-300 border border-gray-300 mb-6">
          {[
            { label: 'Prepared For', value: request.customerName },
            { label: 'Request No.', value: request.requestNumber },
            { label: 'Product', value: request.productName },
            { label: 'Quantity', value: `${request.quantity} ${request.unit}` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white px-4 py-3">
              <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</div>
              <div className="text-sm font-black text-black">{value}</div>
            </div>
          ))}
        </div>

        {/* Pricing table */}
        <table className="w-full border-collapse text-sm mb-6">
          <thead>
            <tr>
              <th className="bg-black text-white text-[10px] font-black uppercase tracking-widest text-left px-4 py-3 border border-black">Description</th>
              <th className="bg-black text-white text-[10px] font-black uppercase tracking-widest text-center px-4 py-3 border border-black w-24">Qty</th>
              <th className="bg-black text-white text-[10px] font-black uppercase tracking-widest text-right px-4 py-3 border border-black w-32">Unit Price</th>
              <th className="bg-black text-white text-[10px] font-black uppercase tracking-widest text-right px-4 py-3 border border-black w-32">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-white">
              <td className="border border-gray-300 px-4 py-3">
                <div className="font-black">{request.productName}</div>
                {request.description && <div className="text-xs text-gray-500 mt-0.5">{request.description}</div>}
              </td>
              <td className="border border-gray-300 px-4 py-3 text-center font-bold">{request.quantity} {request.unit}</td>
              <td className="border border-gray-300 px-4 py-3 text-right font-bold">${unitQuote.toFixed(2)}</td>
              <td className="border border-gray-300 px-4 py-3 text-right font-black">${grand.toFixed(2)}</td>
            </tr>
            <tr className="bg-gray-50">
              <td colSpan={3} className="border border-gray-300 px-4 py-2 text-right text-xs font-black text-gray-500 uppercase tracking-widest">Subtotal</td>
              <td className="border border-gray-300 px-4 py-2 text-right font-bold">${(totalCost + marginAmt).toFixed(2)}</td>
            </tr>
            <tr className="bg-gray-50">
              <td colSpan={3} className="border border-gray-300 px-4 py-2 text-right text-xs font-black text-gray-500 uppercase tracking-widest">Shipping & Handling</td>
              <td className="border border-gray-300 px-4 py-2 text-right font-bold">${shipping.toFixed(2)}</td>
            </tr>
            <tr className="bg-black text-white">
              <td colSpan={3} className="border border-gray-700 px-4 py-3 text-right font-black uppercase tracking-widest text-sm">TOTAL</td>
              <td className="border border-gray-700 px-4 py-3 text-right font-black text-lg">${grand.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        {/* Notes */}
        {request.description && (
          <div className="mb-6 p-4 border border-gray-300 bg-gray-50">
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Product Specifications</div>
            <p className="text-xs text-gray-700">{request.description}</p>
          </div>
        )}

        {/* Terms */}
        <div className="mb-8 p-4 border border-gray-300 bg-gray-50">
          <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Terms & Validity</div>
          <p className="text-[10px] text-gray-600 leading-relaxed">
            This quotation is valid for 7 days from the date of issue. Prices are subject to change based on market conditions and currency fluctuations.
            Payment terms to be agreed upon order confirmation. Delivery timelines provided upon order placement.
          </p>
        </div>

        {/* Signature */}
        <div className="grid grid-cols-2 gap-16 mt-8">
          <div>
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-10">Authorized By — Q Cargo Logistics</div>
            <div className="border-b-2 border-black mb-1"></div>
            <div className="text-[9px] text-gray-400">Signature & Company Stamp</div>
          </div>
          <div>
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-10">Date</div>
            <div className="border-b-2 border-black mb-1"></div>
            <div className="text-[9px] text-gray-400">{today}</div>
          </div>
        </div>

        <div className="mt-10 pt-4 border-t border-gray-200 text-center text-[9px] text-gray-400 uppercase tracking-widest">
          Q Cargo Logistics · Hargeisa, Somaliland · qcargologistic@gmail.com · Quote No: {quoteNumber}
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          aside { display: none !important; }
          header { display: none !important; }
          main { padding: 0 !important; }
          .print-doc { max-width: 100% !important; padding: 12mm !important; margin: 0 !important; }
          body { background: white !important; }
        }
      `}</style>
    </>
  );
}
