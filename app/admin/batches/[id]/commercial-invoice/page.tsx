'use client';

import { useState, useEffect, use } from 'react';
import { Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CommercialInvoicePage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = params && 'then' in params ? use(params) : params;
  const id = resolvedParams?.id;

  const [batch, setBatch] = useState<any>(null);
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/batches?id=${id}`)
      .then(r => r.json())
      .then(data => { setBatch(data); setShipments(data.shipmentsList || []); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-10 text-slate-400 text-sm font-bold">Loading...</div>;
  if (!batch) return <div className="p-10 text-rose-400 text-sm font-bold">Batch not found.</div>;

  const isAir = batch.type === 'AIR';
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const invoiceNumber = `CI-${batch.batchId}-${new Date().getFullYear()}`;

  // Build consolidated items list from all shipments
  type InvoiceRow = { description: string; qty: number; unitValue: number; totalValue: number };
  const invoiceRows: InvoiceRow[] = [];
  let grandTotal = 0;

  shipments.forEach(s => {
    if (s.items?.length > 0) {
      s.items.forEach((it: any) => {
        const qty = it.qty || 1;
        const unitVal = it.value || 0;
        const lineTotal = qty * unitVal;
        grandTotal += lineTotal;
        invoiceRows.push({ description: it.description, qty, unitValue: unitVal, totalValue: lineTotal });
      });
    } else if (s.courierPackages?.length > 0) {
      s.courierPackages.forEach((pkg: any) => {
        const qty = pkg.qty || 1;
        invoiceRows.push({ description: pkg.goods || 'General Goods', qty, unitValue: 0, totalValue: 0 });
      });
    } else {
      // Fall back to shipment total as declared value
      grandTotal += s.total || 0;
      invoiceRows.push({ description: 'General Cargo', qty: 1, unitValue: s.total || 0, totalValue: s.total || 0 });
    }
  });

  const totalQty = invoiceRows.reduce((sum, r) => sum + r.qty, 0);

  return (
    <>
      {/* Print-hide toolbar */}
      <div className="no-print flex items-center gap-4 bg-[#0B0F19] border-b border-slate-800 px-6 py-3">
        <Link href={`/admin/batches/${id}`} className="flex items-center gap-2 text-slate-400 hover:text-slate-100 text-xs font-bold uppercase tracking-wider transition-colors">
          <ArrowLeft size={14} /> Back to Batch
        </Link>
        <span className="text-slate-700 text-xs">·</span>
        <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Commercial Invoice — {batch.batchId}</span>
        <button
          onClick={() => window.print()}
          className="ml-auto flex items-center gap-2 bg-[#F15D38] hover:bg-[#d64420] text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
        >
          <Printer size={14} /> Print / Save PDF
        </button>
      </div>

      {/* Printable Document */}
      <div className="print-doc bg-white text-black min-h-screen p-10 font-sans max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-start pb-6 mb-8 border-b-[3px] border-[#F15D38]">
          <div>
            <div className="text-2xl font-black tracking-tight uppercase">
              <span className="text-[#0B0F19]">Q </span><span className="text-[#F15D38]">Cargo</span><span className="text-[#0d9488]"> Logistics</span>
            </div>
            <div className="text-sm text-gray-500 mt-1">Hargeisa, Somaliland</div>
            <div className="text-sm text-gray-500">qcargologistic@gmail.com</div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black uppercase tracking-widest text-[#0d9488]">Commercial Invoice</div>
            <div className="text-xs text-gray-500 mt-1 font-bold uppercase tracking-widest">Invoice No: {invoiceNumber}</div>
            <div className="text-xs text-gray-500 mt-0.5">Date: {today}</div>
          </div>
        </div>

        {/* Shipper & Consignee */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-4 border border-gray-300 bg-gray-50">
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Shipper / Exporter</div>
            <div className="text-sm font-bold text-black">Partner Warehouse</div>
            <div className="text-sm text-gray-600">China (PRC)</div>
            <div className="text-xs text-gray-500 mt-2">Country of Origin: China</div>
          </div>
          <div className="p-4 border border-gray-300 bg-gray-50">
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Consignee / Importer</div>
            <div className="text-sm font-bold text-black uppercase">Q Cargo Logistics</div>
            <div className="text-sm text-gray-600">Hargeisa, Somaliland</div>
            <div className="text-xs text-gray-500 mt-2">Email: qcargologistic@gmail.com</div>
          </div>
        </div>

        {/* Shipment Details */}
        <div className="grid grid-cols-4 gap-px bg-gray-300 border border-gray-300 mb-8">
          {[
            { label: 'Batch / Reference', value: batch.batchId },
            { label: 'Mode of Transport', value: isAir ? 'Air Freight' : 'Sea Freight' },
            { label: 'Port of Loading', value: 'China' },
            { label: 'Port of Discharge', value: batch.destination || 'Hargeisa, Somalia' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white px-4 py-3">
              <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</div>
              <div className="text-sm font-black text-black">{value}</div>
            </div>
          ))}
        </div>

        {/* Items Table */}
        <table className="w-full border-collapse text-sm mb-8">
          <thead>
            <tr>
              <th className="bg-[#0d9488] text-white text-[10px] font-black uppercase tracking-widest text-center px-3 py-2.5 border border-[#0d9488] w-8">#</th>
              <th className="bg-[#0d9488] text-white text-[10px] font-black uppercase tracking-widest text-left px-3 py-2.5 border border-[#0d9488]">Description of Goods</th>
              <th className="bg-[#0d9488] text-white text-[10px] font-black uppercase tracking-widest text-center px-3 py-2.5 border border-[#0d9488] w-16">Qty</th>
              <th className="bg-[#0d9488] text-white text-[10px] font-black uppercase tracking-widest text-right px-3 py-2.5 border border-[#0d9488] w-28">Unit Value (USD)</th>
              <th className="bg-[#0d9488] text-white text-[10px] font-black uppercase tracking-widest text-right px-3 py-2.5 border border-[#0d9488] w-28">Total Value (USD)</th>
            </tr>
          </thead>
          <tbody>
            {invoiceRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="border border-gray-300 px-3 py-6 text-center text-gray-400 text-xs font-bold italic">
                  No items found
                </td>
              </tr>
            ) : invoiceRows.map((row, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#f0fdfa]'}>
                <td className="border border-gray-300 px-3 py-2.5 text-center text-gray-500 font-bold">{idx + 1}</td>
                <td className="border border-gray-300 px-3 py-2.5 font-bold text-black">{row.description}</td>
                <td className="border border-gray-300 px-3 py-2.5 text-center font-bold text-black">{row.qty}</td>
                <td className="border border-gray-300 px-3 py-2.5 text-right font-bold text-black">
                  {row.unitValue > 0 ? `$${row.unitValue.toFixed(2)}` : '—'}
                </td>
                <td className="border border-gray-300 px-3 py-2.5 text-right font-bold text-black">
                  {row.totalValue > 0 ? `$${row.totalValue.toFixed(2)}` : '—'}
                </td>
              </tr>
            ))}
            {/* Totals */}
            <tr className="bg-[#ccfbf1]">
              <td colSpan={2} className="border border-gray-300 px-3 py-2.5 text-right text-xs font-black uppercase tracking-widest text-[#0f766e]">
                Subtotal
              </td>
              <td className="border border-gray-300 px-3 py-2.5 text-center font-black text-black">{totalQty}</td>
              <td className="border border-gray-300 px-3 py-2.5"></td>
              <td className="border border-gray-300 px-3 py-2.5 text-right font-black text-black">
                {grandTotal > 0 ? `$${grandTotal.toFixed(2)}` : '—'}
              </td>
            </tr>
            <tr className="bg-[#F15D38] text-white">
              <td colSpan={4} className="border border-[#F15D38] px-3 py-3 text-right text-xs font-black uppercase tracking-widest">
                Total Declared Value (USD)
              </td>
              <td className="border border-[#F15D38] px-3 py-3 text-right font-black text-base">
                {grandTotal > 0 ? `$${grandTotal.toFixed(2)}` : 'See remarks'}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Declaration */}
        <div className="p-4 border border-gray-300 bg-gray-50 mb-8 text-xs text-gray-600 leading-relaxed">
          <span className="font-black text-black uppercase text-[10px] tracking-widest block mb-2">Declaration</span>
          I/We hereby certify that the information on this invoice is true and correct and that the contents of this
          shipment are as stated above. These commodities, technology or software were exported from China in accordance
          with export control regulations.
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-16">
          <div>
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-10">Authorized Signature & Date</div>
            <div className="border-b-2 border-black mb-1"></div>
            <div className="text-[9px] text-gray-400">Q Cargo Logistics — Hargeisa, Somaliland</div>
          </div>
          <div>
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-10">Company Stamp</div>
            <div className="border-b-2 border-black mb-1"></div>
            <div className="text-[9px] text-gray-400">Official Use Only</div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-4 border-t border-gray-200 text-center text-[9px] text-gray-400 uppercase tracking-widest">
          Q Cargo Logistics · Hargeisa, Somaliland · qcargologistic@gmail.com · For Customs Use — This is not a payment invoice
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          aside { display: none !important; }
          header { display: none !important; }
          main { padding: 0 !important; }
          .print-doc { max-width: 100% !important; padding: 15mm !important; margin: 0 !important; }
          body { background: white !important; }
        }
      `}</style>
    </>
  );
}
