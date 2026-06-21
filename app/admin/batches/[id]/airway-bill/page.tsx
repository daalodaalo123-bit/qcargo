'use client';

import { useState, useEffect, use } from 'react';
import { Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AirwayBillPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
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
  const awbNumber = `AWB-${batch.batchId}-${new Date().getFullYear()}`;

  let totalWeight = 0;
  let totalPieces = 0;
  let totalDeclaredValue = 0;
  shipments.forEach(s => {
    totalWeight += Number(s.weight) || 0;
    totalDeclaredValue += Number(s.total) || 0;
    if (s.courierPackages?.length > 0) totalPieces += s.courierPackages.reduce((sum: number, p: any) => sum + (p.qty || 1), 0);
    else if (s.items?.length > 0) totalPieces += s.items.reduce((sum: number, it: any) => sum + (it.qty || 1), 0);
    else totalPieces += 1;
  });

  const origin = batch.origin || 'China';
  const destination = batch.destination || 'Hargeisa, Somaliland';

  const airportDeparture = origin.toLowerCase().includes('shanghai') ? 'PVG — Shanghai Pudong International'
    : origin.toLowerCase().includes('guangzhou') ? 'CAN — Guangzhou Baiyun International'
    : origin.toLowerCase().includes('beijing') ? 'PEK — Beijing Capital International'
    : 'CAN — Guangzhou Baiyun International';

  const airportDestination = destination.toLowerCase().includes('mogadishu') ? 'MGQ — Aden Adde International, Mogadishu'
    : 'HGA — Egal International Airport, Hargeisa';

  return (
    <>
      {/* Print-hide toolbar */}
      <div className="no-print flex items-center gap-4 bg-[#0B0F19] border-b border-slate-800 px-6 py-3">
        <Link href={`/admin/batches/${id}`} className="flex items-center gap-2 text-slate-400 hover:text-slate-100 text-xs font-bold uppercase tracking-wider transition-colors">
          <ArrowLeft size={14} /> Back to Batch
        </Link>
        <span className="text-slate-700 text-xs">·</span>
        <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Airway Bill — {batch.batchId}</span>
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
        <div className="flex justify-between items-start pb-6 mb-6 border-b-[3px] border-black">
          <div>
            <div className="text-2xl font-black tracking-tight text-black uppercase">Q Cargo Logistics</div>
            <div className="text-sm text-gray-500 mt-1">Hargeisa, Somaliland</div>
            <div className="text-sm text-gray-500">qcargologistic@gmail.com</div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black uppercase tracking-widest text-black">Air Waybill</div>
            <div className="text-xs text-gray-500 mt-1 font-bold uppercase tracking-widest">AWB No: {awbNumber}</div>
            <div className="text-xs text-gray-500 mt-0.5">Date: {today}</div>
            <div className="text-xs text-gray-500 mt-0.5">Batch Ref: {batch.batchId}</div>
          </div>
        </div>

        {/* Shipper & Consignee */}
        <div className="grid grid-cols-2 gap-px bg-gray-300 border border-gray-300 mb-5">
          <div className="bg-white px-4 py-4">
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Shipper's Name & Address</div>
            <div className="text-xs font-black text-black">Q Cargo Logistics</div>
            <div className="text-xs text-gray-600 mt-1">China Procurement Office</div>
            <div className="text-xs text-gray-600">{airportDeparture.split(' — ')[1] || airportDeparture}</div>
            <div className="text-xs text-gray-600">People's Republic of China</div>
          </div>
          <div className="bg-white px-4 py-4 border-l border-gray-300">
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Consignee's Name & Address</div>
            <div className="text-xs font-black text-black">Q Cargo Logistics</div>
            <div className="text-xs text-gray-600 mt-1">Hargeisa, Somaliland</div>
            <div className="text-xs text-gray-600">Tel: +252 63 xxxxxxx</div>
            <div className="text-xs text-gray-600">qcargologistic@gmail.com</div>
          </div>
        </div>

        {/* Flight / Route details */}
        <div className="grid grid-cols-4 gap-px bg-gray-300 border border-gray-300 mb-5">
          {[
            { label: 'Airport of Departure', value: airportDeparture },
            { label: 'Airport of Destination', value: airportDestination },
            { label: 'Flight No. / Date', value: batch.flightNumber || `QC-${batch.batchId.slice(-4)}` },
            { label: 'Est. Date of Arrival', value: batch.arrival || 'TBD' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white px-4 py-3">
              <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</div>
              <div className="text-xs font-black text-black leading-tight">{value}</div>
            </div>
          ))}
        </div>

        {/* Freight / Handling */}
        <div className="grid grid-cols-4 gap-px bg-gray-300 border border-gray-300 mb-5">
          {[
            { label: 'Freight Charges', value: 'PREPAID' },
            { label: 'Currency', value: 'USD' },
            { label: 'No. of Pieces', value: String(totalPieces) },
            { label: 'Gross Weight', value: `${totalWeight.toFixed(1)} KG` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white px-4 py-3">
              <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</div>
              <div className="text-sm font-black text-black">{value}</div>
            </div>
          ))}
        </div>

        {/* Cargo Details Table */}
        <table className="w-full border-collapse text-sm mb-6">
          <thead>
            <tr>
              <th className="bg-black text-white text-[10px] font-black uppercase tracking-widest text-left px-3 py-2.5 border border-black w-8">#</th>
              <th className="bg-black text-white text-[10px] font-black uppercase tracking-widest text-left px-3 py-2.5 border border-black">AWB / Shipment No.</th>
              <th className="bg-black text-white text-[10px] font-black uppercase tracking-widest text-left px-3 py-2.5 border border-black">Consignee</th>
              <th className="bg-black text-white text-[10px] font-black uppercase tracking-widest text-left px-3 py-2.5 border border-black">Nature & Quantity of Goods</th>
              <th className="bg-black text-white text-[10px] font-black uppercase tracking-widest text-center px-3 py-2.5 border border-black w-20">Pieces</th>
              <th className="bg-black text-white text-[10px] font-black uppercase tracking-widest text-center px-3 py-2.5 border border-black w-24">Gross Wt (KG)</th>
              <th className="bg-black text-white text-[10px] font-black uppercase tracking-widest text-center px-3 py-2.5 border border-black w-24">Value (USD)</th>
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
                  <td className="border border-gray-300 px-3 py-2.5 text-center font-bold">{(Number(s.weight) || 0).toFixed(1)}</td>
                  <td className="border border-gray-300 px-3 py-2.5 text-center font-bold">${(Number(s.total) || 0).toFixed(2)}</td>
                </tr>
              );
            })}
            {/* Totals row */}
            <tr className="bg-black text-white">
              <td colSpan={4} className="border border-gray-700 px-3 py-2.5 text-right text-[10px] font-black uppercase tracking-widest">
                Total — {shipments.length} consignment{shipments.length !== 1 ? 's' : ''}
              </td>
              <td className="border border-gray-700 px-3 py-2.5 text-center font-black">{totalPieces}</td>
              <td className="border border-gray-700 px-3 py-2.5 text-center font-black">{totalWeight.toFixed(1)}</td>
              <td className="border border-gray-700 px-3 py-2.5 text-center font-black">${totalDeclaredValue.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        {/* Handling / Special Instructions */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 border border-gray-300 bg-gray-50">
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Handling Information</div>
            <div className="text-[10px] text-gray-600">FRAGILE — HANDLE WITH CARE</div>
            <div className="text-[10px] text-gray-600 mt-0.5">THIS SIDE UP</div>
            <div className="text-[10px] text-gray-600 mt-0.5">KEEP DRY</div>
          </div>
          <div className="p-4 border border-gray-300 bg-gray-50">
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Carrier's Certification</div>
            <p className="text-[10px] text-gray-600 leading-relaxed">
              Shipper certifies that the particulars on the face hereof are correct and that insofar as any part of the consignment contains dangerous goods,
              such part is properly described by name and is in proper condition for carriage by air.
            </p>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-3 gap-8 mt-6">
          <div>
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-8">Shipper's Signature</div>
            <div className="border-b-2 border-black mb-1"></div>
            <div className="text-[9px] text-gray-400">Authorized Signatory</div>
          </div>
          <div>
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-8">Issued by (Carrier / Agent)</div>
            <div className="border-b-2 border-black mb-1"></div>
            <div className="text-[9px] text-gray-400">Q Cargo Logistics</div>
          </div>
          <div>
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-8">Date</div>
            <div className="border-b-2 border-black mb-1"></div>
            <div className="text-[9px] text-gray-400">{today}</div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 pt-4 border-t border-gray-200 text-center text-[9px] text-gray-400 uppercase tracking-widest">
          Q Cargo Logistics · Hargeisa, Somaliland · qcargologistic@gmail.com · AWB No: {awbNumber}
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
