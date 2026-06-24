'use client';

import { useState, useEffect, use } from 'react';
import { Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CustomsDeclarationPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
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
  const declNumber = `CUS-${batch.batchId}-${new Date().getFullYear()}`;

  let totalWeight = 0;
  let totalCBM = 0;
  let totalCartons = 0;
  let totalValue = 0;
  shipments.forEach(s => {
    totalWeight += Number(s.weight) || 0;
    totalCBM += Number(s.cbm) || 0;
    totalValue += Number(s.total) || 0;
    if (s.courierPackages?.length > 0) totalCartons += s.courierPackages.reduce((sum: number, p: any) => sum + (p.qty || 1), 0);
    else if (s.items?.length > 0) totalCartons += s.items.reduce((sum: number, it: any) => sum + (it.qty || 1), 0);
    else totalCartons += 1;
  });

  const origin = batch.origin || 'China';
  const destination = batch.destination || 'Hargeisa, Somaliland';
  const isAir = batch.type === 'AIR';

  return (
    <>
      {/* Print-hide toolbar */}
      <div className="no-print flex items-center gap-4 bg-[#0B0F19] border-b border-slate-800 px-6 py-3">
        <Link href={`/admin/batches/${id}`} className="flex items-center gap-2 text-slate-400 hover:text-slate-100 text-xs font-bold uppercase tracking-wider transition-colors">
          <ArrowLeft size={14} /> Back to Batch
        </Link>
        <span className="text-slate-700 text-xs">·</span>
        <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Customs Declaration — {batch.batchId}</span>
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
            <div className="text-3xl font-black uppercase tracking-widest text-[#0d9488]">Customs Declaration</div>
            <div className="text-xs text-gray-500 mt-1 font-bold uppercase tracking-widest">Decl. No: {declNumber}</div>
            <div className="text-xs text-gray-500 mt-0.5">Date: {today}</div>
            <div className="text-xs text-gray-500 mt-0.5">Batch Ref: {batch.batchId}</div>
          </div>
        </div>

        {/* Declaration type banner */}
        <div className="bg-[#0d9488] text-white text-center py-2 mb-5">
          <span className="text-[10px] font-black uppercase tracking-widest">
            IMPORT DECLARATION — {isAir ? 'AIR FREIGHT' : 'SEA FREIGHT'} — REPUBLIC OF SOMALILAND
          </span>
        </div>

        {/* Declarant + Importer */}
        <div className="grid grid-cols-2 gap-px bg-gray-300 border border-gray-300 mb-5">
          <div className="bg-white px-5 py-4">
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">1. Declarant / Agent</div>
            <div className="text-sm font-black text-black">Q Cargo Logistics</div>
            <div className="text-xs text-gray-600 mt-1">Hargeisa, Somaliland</div>
            <div className="text-xs text-gray-600">qcargologistic@gmail.com</div>
          </div>
          <div className="bg-white px-5 py-4 border-l border-gray-300">
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">2. Importer of Record</div>
            <div className="text-sm font-black text-black">Q Cargo Logistics</div>
            <div className="text-xs text-gray-600 mt-1">Hargeisa, Somaliland</div>
            <div className="text-xs text-gray-600">License / TIN: _______________</div>
          </div>
        </div>

        {/* Shipment details grid */}
        <div className="grid grid-cols-4 gap-px bg-gray-300 border border-gray-300 mb-5">
          {[
            { label: '3. Mode of Transport', value: isAir ? 'Air Freight' : 'Sea Freight' },
            { label: '4. Country of Export', value: 'China (CN)' },
            { label: '5. Country of Origin', value: 'China (CN)' },
            { label: '6. Port / Airport of Entry', value: isAir ? 'Egal Intl Airport (HGA)' : 'Port of Berbera' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white px-4 py-3">
              <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</div>
              <div className="text-sm font-black text-black">{value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-px bg-gray-300 border border-gray-300 mb-5">
          {[
            { label: '7. Vessel / Flight / Ref', value: isAir ? (batch.flightNumber || `FLT-${batch.batchId}`) : (batch.vessel || `VSL-${batch.batchId}`) },
            { label: '8. Date of Arrival', value: batch.arrival || '________________' },
            { label: '9. Total Packages', value: `${totalCartons} pkgs` },
            { label: '10. Gross Weight', value: `${totalWeight.toFixed(1)} KG` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white px-4 py-3">
              <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</div>
              <div className="text-sm font-black text-black">{value}</div>
            </div>
          ))}
        </div>

        {/* Goods Table */}
        <table className="w-full border-collapse text-sm mb-6">
          <thead>
            <tr>
              <th className="bg-[#0d9488] text-white text-[10px] font-black uppercase tracking-widest text-left px-3 py-2.5 border border-[#0d9488] w-8">11.</th>
              <th className="bg-[#0d9488] text-white text-[10px] font-black uppercase tracking-widest text-left px-3 py-2.5 border border-[#0d9488]">Description of Goods</th>
              <th className="bg-[#0d9488] text-white text-[10px] font-black uppercase tracking-widest text-left px-3 py-2.5 border border-[#0d9488] w-28">Consignee</th>
              <th className="bg-[#0d9488] text-white text-[10px] font-black uppercase tracking-widest text-center px-3 py-2.5 border border-[#0d9488] w-20">HS Code</th>
              <th className="bg-[#0d9488] text-white text-[10px] font-black uppercase tracking-widest text-center px-3 py-2.5 border border-[#0d9488] w-20">Qty</th>
              <th className="bg-[#0d9488] text-white text-[10px] font-black uppercase tracking-widest text-center px-3 py-2.5 border border-[#0d9488] w-20">Wt (KG)</th>
              <th className="bg-[#0d9488] text-white text-[10px] font-black uppercase tracking-widest text-center px-3 py-2.5 border border-[#0d9488] w-28">CIF Value (USD)</th>
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
                  <td className="border border-gray-300 px-3 py-2.5 text-gray-700 text-xs">{goodsDesc}</td>
                  <td className="border border-gray-300 px-3 py-2.5 font-bold text-xs">{s.customer}</td>
                  <td className="border border-gray-300 px-3 py-2.5 text-center text-gray-400 text-xs font-mono">N/A</td>
                  <td className="border border-gray-300 px-3 py-2.5 text-center font-bold">{qty}</td>
                  <td className="border border-gray-300 px-3 py-2.5 text-center font-bold">{(Number(s.weight) || 0).toFixed(1)}</td>
                  <td className="border border-gray-300 px-3 py-2.5 text-center font-bold">${(Number(s.total) || 0).toFixed(2)}</td>
                </tr>
              );
            })}
            <tr className="bg-[#F15D38] text-white">
              <td colSpan={4} className="border border-gray-700 px-3 py-2.5 text-right text-[10px] font-black uppercase tracking-widest">
                Totals — {shipments.length} shipment{shipments.length !== 1 ? 's' : ''}
              </td>
              <td className="border border-gray-700 px-3 py-2.5 text-center font-black">{totalCartons}</td>
              <td className="border border-gray-700 px-3 py-2.5 text-center font-black">{totalWeight.toFixed(1)}</td>
              <td className="border border-gray-700 px-3 py-2.5 text-center font-black">${totalValue.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        {/* Financial summary */}
        <div className="grid grid-cols-3 gap-px bg-gray-300 border border-gray-300 mb-6">
          {[
            { label: '12. Total CIF Value (USD)', value: `$${totalValue.toFixed(2)}` },
            { label: '13. Customs Duty Amount', value: '________________' },
            { label: '14. Total Tax / Duties', value: '________________' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white px-4 py-4">
              <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">{label}</div>
              <div className="text-lg font-black text-black">{value}</div>
            </div>
          ))}
        </div>

        {/* Declaration statement */}
        <div className="mb-6 p-5 border-2 border-black bg-gray-50">
          <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-3">15. Declaration Statement</div>
          <p className="text-[10px] text-gray-700 leading-relaxed">
            I/We hereby declare that the information provided on this Customs Declaration is true, accurate, and complete to the best of my/our
            knowledge. The goods described herein are correctly described and their declared values represent the actual transaction value.
            I/We accept full responsibility for any errors or omissions and agree to pay all applicable duties and taxes as determined by the
            Customs Authority of the Republic of Somaliland.
          </p>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-3 gap-8 mt-8">
          <div>
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-10">Declarant Signature</div>
            <div className="border-b-2 border-black mb-1"></div>
            <div className="text-[9px] text-gray-400">Authorized Signatory</div>
          </div>
          <div>
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-10">Company Stamp</div>
            <div className="border-b-2 border-black mb-1"></div>
            <div className="text-[9px] text-gray-400">Q Cargo Logistics</div>
          </div>
          <div>
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-10">Customs Officer (Official Use)</div>
            <div className="border-b-2 border-black mb-1"></div>
            <div className="text-[9px] text-gray-400">Stamp &amp; Date</div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 pt-4 border-t border-gray-200 text-center text-[9px] text-gray-400 uppercase tracking-widest">
          Q Cargo Logistics · Hargeisa, Somaliland · qcargologistic@gmail.com · Decl. No: {declNumber}
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
