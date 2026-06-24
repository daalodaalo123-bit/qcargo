'use client';

import { useState, useEffect, use } from 'react';
import { Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function BillOfLadingPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
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

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const bolNumber = `BOL-${batch.batchId}-${new Date().getFullYear()}`;

  let totalCBM = 0;
  let totalWeight = 0;
  let totalCartons = 0;
  shipments.forEach(s => {
    totalCBM += Number(s.cbm) || 0;
    totalWeight += Number(s.weight) || 0;
    if (s.courierPackages?.length > 0) totalCartons += s.courierPackages.reduce((sum: number, p: any) => sum + (p.qty || 1), 0);
    else if (s.items?.length > 0) totalCartons += s.items.reduce((sum: number, it: any) => sum + (it.qty || 1), 0);
    else totalCartons += 1;
  });

  const origin = batch.origin || 'China';
  const destination = batch.destination || 'Hargeisa, Somaliland';

  // Derive port names from origin/destination
  const portOfLoading = origin.toLowerCase().includes('shanghai') ? 'Shanghai, China'
    : origin.toLowerCase().includes('guangzhou') ? 'Guangzhou, China'
    : `${origin} Port, China`;
  const portOfDischarge = destination.toLowerCase().includes('berbera') ? 'Port of Berbera, Somaliland'
    : 'Port of Berbera, Somaliland';

  return (
    <>
      {/* Print-hide toolbar */}
      <div className="no-print flex items-center gap-4 bg-[#0B0F19] border-b border-slate-800 px-6 py-3">
        <Link href={`/admin/batches/${id}`} className="flex items-center gap-2 text-slate-400 hover:text-slate-100 text-xs font-bold uppercase tracking-wider transition-colors">
          <ArrowLeft size={14} /> Back to Batch
        </Link>
        <span className="text-slate-700 text-xs">·</span>
        <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Bill of Lading — {batch.batchId}</span>
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
        <div className="flex justify-between items-start pb-6 mb-6 border-b-[3px] border-[#F15D38]">
          <div>
            <div className="text-2xl font-black tracking-tight uppercase"><span className="text-[#0B0F19]">Q </span><span className="text-[#F15D38]">Cargo</span><span className="text-[#0d9488]"> Logistics</span></div>
            <div className="text-sm text-gray-500 mt-1">Hargeisa, Somaliland</div>
            <div className="text-sm text-gray-500">qcargologistic@gmail.com</div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black uppercase tracking-widest text-[#0d9488]">Bill of Lading</div>
            <div className="text-xs text-gray-500 mt-1 font-bold uppercase tracking-widest">B/L No: {bolNumber}</div>
            <div className="text-xs text-gray-500 mt-0.5">Date: {today}</div>
            <div className="text-xs text-gray-500 mt-0.5">Batch Ref: {batch.batchId}</div>
          </div>
        </div>

        {/* Shipper / Consignee / Notify Party row */}
        <div className="grid grid-cols-3 gap-px bg-gray-300 border border-gray-300 mb-5">
          <div className="bg-white px-4 py-4 col-span-1">
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Shipper / Exporter</div>
            <div className="text-xs font-black text-black">Q Cargo Logistics</div>
            <div className="text-xs text-gray-600 mt-1">China Procurement Office</div>
            <div className="text-xs text-gray-600">{portOfLoading}</div>
          </div>
          <div className="bg-white px-4 py-4 col-span-1 border-l border-gray-300">
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Consignee</div>
            <div className="text-xs font-black text-black">Q Cargo Logistics</div>
            <div className="text-xs text-gray-600 mt-1">Hargeisa, Somaliland</div>
            <div className="text-xs text-gray-600">Tel: +252 63 xxxxxxx</div>
            <div className="text-xs text-gray-600">qcargologistic@gmail.com</div>
          </div>
          <div className="bg-white px-4 py-4 col-span-1 border-l border-gray-300">
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Notify Party</div>
            <div className="text-xs font-black text-black">Q Cargo Logistics</div>
            <div className="text-xs text-gray-600 mt-1">Hargeisa, Somaliland</div>
            <div className="text-xs text-gray-600">Same as consignee</div>
          </div>
        </div>

        {/* Vessel / Port details */}
        <div className="grid grid-cols-4 gap-px bg-gray-300 border border-gray-300 mb-5">
          {[
            { label: 'Vessel / Voyage No.', value: batch.vessel || `VSL-${batch.batchId}` },
            { label: 'Port of Loading', value: portOfLoading },
            { label: 'Port of Discharge', value: portOfDischarge },
            { label: 'Est. Date of Arrival', value: batch.arrival || 'TBD' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white px-4 py-3">
              <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</div>
              <div className="text-sm font-black text-black">{value}</div>
            </div>
          ))}
        </div>

        {/* Container / Seal */}
        <div className="grid grid-cols-4 gap-px bg-gray-300 border border-gray-300 mb-5">
          {[
            { label: 'Container No.', value: batch.containerNumber || '________________' },
            { label: 'Seal No.', value: batch.sealNumber || '________________' },
            { label: 'Freight Terms', value: 'PREPAID' },
            { label: 'Service Type', value: 'FCL / LCL' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white px-4 py-3">
              <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</div>
              <div className="text-sm font-black text-black">{value}</div>
            </div>
          ))}
        </div>

        {/* Cargo Description Table */}
        <table className="w-full border-collapse text-sm mb-6">
          <thead>
            <tr>
              <th className="bg-[#0d9488] text-white text-[10px] font-black uppercase tracking-widest text-left px-3 py-2.5 border border-[#0d9488] w-8">#</th>
              <th className="bg-[#0d9488] text-white text-[10px] font-black uppercase tracking-widest text-left px-3 py-2.5 border border-[#0d9488]">Shipment No.</th>
              <th className="bg-[#0d9488] text-white text-[10px] font-black uppercase tracking-widest text-left px-3 py-2.5 border border-[#0d9488]">Consignee / Customer</th>
              <th className="bg-[#0d9488] text-white text-[10px] font-black uppercase tracking-widest text-left px-3 py-2.5 border border-[#0d9488]">Description of Goods</th>
              <th className="bg-[#0d9488] text-white text-[10px] font-black uppercase tracking-widest text-center px-3 py-2.5 border border-[#0d9488] w-20">Cartons</th>
              <th className="bg-[#0d9488] text-white text-[10px] font-black uppercase tracking-widest text-center px-3 py-2.5 border border-[#0d9488] w-20">Weight (KG)</th>
              <th className="bg-[#0d9488] text-white text-[10px] font-black uppercase tracking-widest text-center px-3 py-2.5 border border-[#0d9488] w-20">CBM</th>
            </tr>
          </thead>
          <tbody>
            {shipments.length === 0 ? (
              <tr>
                <td colSpan={7} className="border border-gray-300 px-3 py-6 text-center text-gray-400 text-xs font-bold italic">
                  No shipments assigned to this batch
                </td>
              </tr>
            ) : shipments.map((s, idx) => {
              let goodsDesc = 'General Merchandise';
              let qty = 1;
              if (s.courierPackages?.length > 0) {
                goodsDesc = s.courierPackages.map((p: any) => p.goods).filter(Boolean).join(', ') || 'General Merchandise';
                qty = s.courierPackages.reduce((sum: number, p: any) => sum + (p.qty || 1), 0);
              } else if (s.items?.length > 0) {
                goodsDesc = s.items.map((it: any) => it.description).filter(Boolean).join(', ');
                qty = s.items.reduce((sum: number, it: any) => sum + (it.qty || 1), 0);
              }
              return (
                <tr key={s.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#f0fdfa]'}>
                  <td className="border border-gray-300 px-3 py-2.5 text-center font-bold text-gray-500">{idx + 1}</td>
                  <td className="border border-gray-300 px-3 py-2.5 font-mono font-black text-sm">{s.shipmentNumber}</td>
                  <td className="border border-gray-300 px-3 py-2.5 font-bold">{s.customer}</td>
                  <td className="border border-gray-300 px-3 py-2.5 text-gray-700 text-xs">{goodsDesc}</td>
                  <td className="border border-gray-300 px-3 py-2.5 text-center font-bold">{qty}</td>
                  <td className="border border-gray-300 px-3 py-2.5 text-center font-bold">{(Number(s.weight) || 0).toFixed(1)}</td>
                  <td className="border border-gray-300 px-3 py-2.5 text-center font-bold">{(Number(s.cbm) || 0).toFixed(3)}</td>
                </tr>
              );
            })}
            {/* Totals row */}
            <tr className="bg-[#F15D38] text-white">
              <td colSpan={4} className="border border-gray-700 px-3 py-2.5 text-right text-[10px] font-black uppercase tracking-widest">
                Total — {shipments.length} shipment{shipments.length !== 1 ? 's' : ''}
              </td>
              <td className="border border-gray-700 px-3 py-2.5 text-center font-black">{totalCartons}</td>
              <td className="border border-gray-700 px-3 py-2.5 text-center font-black">{totalWeight.toFixed(1)}</td>
              <td className="border border-gray-700 px-3 py-2.5 text-center font-black">{totalCBM.toFixed(3)}</td>
            </tr>
          </tbody>
        </table>

        {/* Terms & Conditions note */}
        <div className="mb-6 p-4 border border-gray-300 bg-gray-50">
          <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Terms & Conditions</div>
          <p className="text-[10px] text-gray-600 leading-relaxed">
            Received in apparent good order and condition, unless otherwise noted herein, the goods or packages said to contain goods herein described,
            to be transported to such place as agreed, authorized and permitted and subject to all terms and conditions appearing on the front and reverse
            side of this Bill of Lading. Freight charges are deemed PREPAID. This Bill of Lading is issued in one (1) original.
          </p>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-16 mt-8">
          <div>
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-10">Signed for the Carrier — Q Cargo Logistics</div>
            <div className="border-b-2 border-black mb-1"></div>
            <div className="text-[9px] text-gray-400">Authorized Signature & Company Stamp</div>
          </div>
          <div>
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-10">Date of Issue</div>
            <div className="border-b-2 border-black mb-1"></div>
            <div className="text-[9px] text-gray-400">{today}</div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 pt-4 border-t border-gray-200 text-center text-[9px] text-gray-400 uppercase tracking-widest">
          Q Cargo Logistics · Hargeisa, Somaliland · qcargologistic@gmail.com · B/L No: {bolNumber}
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
