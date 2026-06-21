'use client';

import { useState, useEffect, use } from 'react';
import { Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PackingListPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
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
  const docNumber = `PL-${batch.batchId}-${new Date().getFullYear()}`;

  let totalQty = 0;
  let totalWeight = 0;
  let totalCBM = 0;
  shipments.forEach(s => {
    if (isAir) totalWeight += Number(s.weight) || 0;
    else totalCBM += Number(s.cbm) || 0;
    if (s.courierPackages?.length > 0) totalQty += s.courierPackages.reduce((sum: number, p: any) => sum + (p.qty || 1), 0);
    else if (s.items?.length > 0) totalQty += s.items.reduce((sum: number, it: any) => sum + (it.qty || 1), 0);
    else totalQty += 1;
  });

  return (
    <>
      {/* Print-hide toolbar */}
      <div className="no-print flex items-center gap-4 bg-[#0B0F19] border-b border-slate-800 px-6 py-3">
        <Link href={`/admin/batches/${id}`} className="flex items-center gap-2 text-slate-400 hover:text-slate-100 text-xs font-bold uppercase tracking-wider transition-colors">
          <ArrowLeft size={14} /> Back to Batch
        </Link>
        <span className="text-slate-700 text-xs">·</span>
        <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Packing List — {batch.batchId}</span>
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
        <div className="flex justify-between items-start pb-6 mb-8 border-b-[3px] border-black">
          <div>
            <div className="text-2xl font-black tracking-tight text-black uppercase">Q Cargo Logistics</div>
            <div className="text-sm text-gray-500 mt-1">Hargeisa, Somaliland</div>
            <div className="text-sm text-gray-500">qcargologistic@gmail.com</div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black uppercase tracking-widest text-black">Packing List</div>
            <div className="text-xs text-gray-500 mt-1 font-bold uppercase tracking-widest">Doc No: {docNumber}</div>
            <div className="text-xs text-gray-500 mt-0.5">Date: {today}</div>
          </div>
        </div>

        {/* Batch Info Grid */}
        <div className="grid grid-cols-3 gap-px bg-gray-300 border border-gray-300 mb-8">
          {[
            { label: 'Batch Reference', value: batch.batchId },
            { label: 'Freight Type', value: isAir ? 'Air Freight' : 'Sea Freight' },
            { label: 'Status', value: batch.status?.replace(/_/g, ' ') },
            { label: 'Origin', value: batch.origin || 'China' },
            { label: 'Destination', value: batch.destination || 'Hargeisa, Somalia' },
            { label: 'Est. Arrival', value: batch.arrival || 'TBD' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white px-4 py-3">
              <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</div>
              <div className="text-sm font-black text-black">{value}</div>
            </div>
          ))}
        </div>

        {/* Shipments Table */}
        <table className="w-full border-collapse text-sm mb-8">
          <thead>
            <tr>
              <th className="bg-black text-white text-[10px] font-black uppercase tracking-widest text-left px-3 py-2.5 border border-black w-8">#</th>
              <th className="bg-black text-white text-[10px] font-black uppercase tracking-widest text-left px-3 py-2.5 border border-black">Shipment No.</th>
              <th className="bg-black text-white text-[10px] font-black uppercase tracking-widest text-left px-3 py-2.5 border border-black">Customer</th>
              <th className="bg-black text-white text-[10px] font-black uppercase tracking-widest text-left px-3 py-2.5 border border-black">Description of Goods</th>
              <th className="bg-black text-white text-[10px] font-black uppercase tracking-widest text-center px-3 py-2.5 border border-black w-20">Cartons</th>
              <th className="bg-black text-white text-[10px] font-black uppercase tracking-widest text-center px-3 py-2.5 border border-black w-24">
                {isAir ? 'Weight (KG)' : 'CBM'}
              </th>
            </tr>
          </thead>
          <tbody>
            {shipments.length === 0 ? (
              <tr>
                <td colSpan={6} className="border border-gray-300 px-3 py-6 text-center text-gray-400 text-xs font-bold italic">
                  No shipments assigned to this batch
                </td>
              </tr>
            ) : shipments.map((s, idx) => {
              let goodsDesc = 'General Cargo';
              let qty = 1;
              if (s.courierPackages?.length > 0) {
                goodsDesc = s.courierPackages.map((p: any) => p.goods).filter(Boolean).join(', ') || 'General Cargo';
                qty = s.courierPackages.reduce((sum: number, p: any) => sum + (p.qty || 1), 0);
              } else if (s.items?.length > 0) {
                goodsDesc = s.items.map((it: any) => it.description).filter(Boolean).join(', ');
                qty = s.items.reduce((sum: number, it: any) => sum + (it.qty || 1), 0);
              }
              return (
                <tr key={s.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border border-gray-300 px-3 py-2.5 text-center font-bold text-gray-500">{idx + 1}</td>
                  <td className="border border-gray-300 px-3 py-2.5 font-mono font-black text-sm">{s.shipmentNumber}</td>
                  <td className="border border-gray-300 px-3 py-2.5 font-bold">{s.customer}</td>
                  <td className="border border-gray-300 px-3 py-2.5 text-gray-700 text-xs">{goodsDesc}</td>
                  <td className="border border-gray-300 px-3 py-2.5 text-center font-bold">{qty}</td>
                  <td className="border border-gray-300 px-3 py-2.5 text-center font-bold">
                    {isAir ? (Number(s.weight) || 0).toFixed(1) : (Number(s.cbm) || 0).toFixed(2)}
                  </td>
                </tr>
              );
            })}
            {/* Totals */}
            <tr className="bg-black text-white">
              <td colSpan={4} className="border border-gray-700 px-3 py-2.5 text-right text-[10px] font-black uppercase tracking-widest">
                Total — {shipments.length} shipment{shipments.length !== 1 ? 's' : ''}
              </td>
              <td className="border border-gray-700 px-3 py-2.5 text-center font-black">{totalQty}</td>
              <td className="border border-gray-700 px-3 py-2.5 text-center font-black">
                {isAir ? `${totalWeight.toFixed(1)} KG` : `${totalCBM.toFixed(2)} CBM`}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Remarks */}
        <div className="mb-10 p-4 border border-gray-300 bg-gray-50">
          <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Remarks / Notes</div>
          <div className="h-10 border-b border-dashed border-gray-300"></div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-16 mt-8">
          <div>
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-10">Prepared By (Name & Signature)</div>
            <div className="border-b-2 border-black mb-1"></div>
            <div className="text-[9px] text-gray-400">Q Cargo Logistics — Hargeisa</div>
          </div>
          <div>
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-10">Date & Company Stamp</div>
            <div className="border-b-2 border-black mb-1"></div>
            <div className="text-[9px] text-gray-400">Official Use</div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-4 border-t border-gray-200 text-center text-[9px] text-gray-400 uppercase tracking-widest">
          Q Cargo Logistics · Hargeisa, Somaliland · qcargologistic@gmail.com · This document is for shipping purposes only
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
