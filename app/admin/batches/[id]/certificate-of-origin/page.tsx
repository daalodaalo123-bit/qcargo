'use client';

import { useState, useEffect, use } from 'react';
import { Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CertificateOfOriginPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
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
  const cooNumber = `COO-${batch.batchId}-${new Date().getFullYear()}`;

  let totalWeight = 0;
  let totalCartons = 0;
  let totalValue = 0;
  shipments.forEach(s => {
    totalWeight += Number(s.weight) || 0;
    totalValue += Number(s.total) || 0;
    if (s.courierPackages?.length > 0) totalCartons += s.courierPackages.reduce((sum: number, p: any) => sum + (p.qty || 1), 0);
    else if (s.items?.length > 0) totalCartons += s.items.reduce((sum: number, it: any) => sum + (it.qty || 1), 0);
    else totalCartons += 1;
  });

  const origin = batch.origin || 'China';
  const destination = batch.destination || 'Hargeisa, Somaliland';

  return (
    <>
      {/* Print-hide toolbar */}
      <div className="no-print flex items-center gap-4 bg-[#0B0F19] border-b border-slate-800 px-6 py-3">
        <Link href={`/admin/batches/${id}`} className="flex items-center gap-2 text-slate-400 hover:text-slate-100 text-xs font-bold uppercase tracking-wider transition-colors">
          <ArrowLeft size={14} /> Back to Batch
        </Link>
        <span className="text-slate-700 text-xs">·</span>
        <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Certificate of Origin — {batch.batchId}</span>
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
        <div className="text-center pb-6 mb-6 border-b-[3px] border-[#F15D38]">
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">People's Republic of China</div>
          <div className="text-3xl font-black tracking-tight text-[#0d9488] uppercase mb-1">Certificate of Origin</div>
          <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">Non-Preferential · For Customs Purposes Only</div>
        </div>

        {/* Cert number + date row */}
        <div className="flex justify-between items-start mb-6">
          <div className="text-xs text-gray-500">
            <span className="font-black text-gray-700 uppercase tracking-widest text-[10px]">Certificate No:</span>{' '}
            <span className="font-mono font-black text-black">{cooNumber}</span>
          </div>
          <div className="text-right text-xs text-gray-500">
            <span className="font-black text-gray-700 uppercase tracking-widest text-[10px]">Date of Issue:</span>{' '}
            <span className="font-black text-black">{today}</span>
          </div>
        </div>

        {/* Exporter / Consignee */}
        <div className="grid grid-cols-2 gap-px bg-gray-300 border border-gray-300 mb-5">
          <div className="bg-white px-5 py-5">
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">1. Exporter (Name, Address, Country)</div>
            <div className="text-sm font-black text-black">Q Cargo Logistics</div>
            <div className="text-xs text-gray-600 mt-1">China Procurement Office</div>
            <div className="text-xs text-gray-600">{origin}, China</div>
            <div className="text-xs text-gray-600 mt-1">qcargologistic@gmail.com</div>
          </div>
          <div className="bg-white px-5 py-5 border-l border-gray-300">
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">2. Consignee (Name, Address, Country)</div>
            <div className="text-sm font-black text-black">Q Cargo Logistics</div>
            <div className="text-xs text-gray-600 mt-1">Hargeisa, Somaliland</div>
            <div className="text-xs text-gray-600">{destination}</div>
            <div className="text-xs text-gray-600 mt-1">qcargologistic@gmail.com</div>
          </div>
        </div>

        {/* Transport / Origin */}
        <div className="grid grid-cols-3 gap-px bg-gray-300 border border-gray-300 mb-5">
          <div className="bg-white px-4 py-4">
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">3. Transport Details</div>
            <div className="text-xs font-black text-black">{batch.type === 'AIR' ? 'Air Freight' : 'Sea Freight'}</div>
            <div className="text-xs text-gray-600 mt-0.5">Ref: {batch.batchId}</div>
          </div>
          <div className="bg-white px-4 py-4 border-l border-gray-300">
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">4. Country of Origin</div>
            <div className="text-xs font-black text-black">People's Republic of China</div>
          </div>
          <div className="bg-white px-4 py-4 border-l border-gray-300">
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">5. Country of Destination</div>
            <div className="text-xs font-black text-black">Republic of Somaliland</div>
          </div>
        </div>

        {/* Goods Table */}
        <table className="w-full border-collapse text-sm mb-6">
          <thead>
            <tr>
              <th className="bg-[#0d9488] text-white text-[10px] font-black uppercase tracking-widest text-left px-3 py-2.5 border border-[#0d9488] w-8">6. #</th>
              <th className="bg-[#0d9488] text-white text-[10px] font-black uppercase tracking-widest text-left px-3 py-2.5 border border-[#0d9488]">7. Description of Goods</th>
              <th className="bg-[#0d9488] text-white text-[10px] font-black uppercase tracking-widest text-left px-3 py-2.5 border border-[#0d9488] w-28">8. Shipment No.</th>
              <th className="bg-[#0d9488] text-white text-[10px] font-black uppercase tracking-widest text-center px-3 py-2.5 border border-[#0d9488] w-20">9. Qty / Pkgs</th>
              <th className="bg-[#0d9488] text-white text-[10px] font-black uppercase tracking-widest text-center px-3 py-2.5 border border-[#0d9488] w-24">10. Gross Wt (KG)</th>
              <th className="bg-[#0d9488] text-white text-[10px] font-black uppercase tracking-widest text-center px-3 py-2.5 border border-[#0d9488] w-24">11. FOB Value (USD)</th>
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
                  <td className="border border-gray-300 px-3 py-2.5 font-mono font-black text-xs">{s.shipmentNumber}</td>
                  <td className="border border-gray-300 px-3 py-2.5 text-center font-bold">{qty} pkgs</td>
                  <td className="border border-gray-300 px-3 py-2.5 text-center font-bold">{(Number(s.weight) || 0).toFixed(1)}</td>
                  <td className="border border-gray-300 px-3 py-2.5 text-center font-bold">${(Number(s.total) || 0).toFixed(2)}</td>
                </tr>
              );
            })}
            <tr className="bg-[#F15D38] text-white">
              <td colSpan={3} className="border border-gray-700 px-3 py-2.5 text-right text-[10px] font-black uppercase tracking-widest">
                Totals — {shipments.length} shipment{shipments.length !== 1 ? 's' : ''}
              </td>
              <td className="border border-gray-700 px-3 py-2.5 text-center font-black">{totalCartons} pkgs</td>
              <td className="border border-gray-700 px-3 py-2.5 text-center font-black">{totalWeight.toFixed(1)}</td>
              <td className="border border-gray-700 px-3 py-2.5 text-center font-black">${totalValue.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        {/* Declaration box */}
        <div className="mb-6 p-5 border-2 border-black bg-gray-50">
          <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-3">12. Declaration by the Exporter</div>
          <p className="text-[10px] text-gray-700 leading-relaxed mb-4">
            The undersigned hereby declares that the above details and statements are correct, that all goods were produced or manufactured in the
            <strong> People's Republic of China</strong>, and that they comply with the origin requirements specified for this certificate.
          </p>
          <div className="grid grid-cols-2 gap-16 mt-6">
            <div>
              <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-8">Place and Date of Issue</div>
              <div className="border-b-2 border-black mb-1"></div>
              <div className="text-[9px] text-gray-500">China · {today}</div>
            </div>
            <div>
              <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-8">Signature &amp; Company Stamp</div>
              <div className="border-b-2 border-black mb-1"></div>
              <div className="text-[9px] text-gray-500">Authorized Signatory — Q Cargo Logistics</div>
            </div>
          </div>
        </div>

        {/* Certifying authority box */}
        <div className="p-5 border border-gray-300 bg-white mb-6">
          <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">13. Certification (For Official Use)</div>
          <p className="text-[10px] text-gray-500 leading-relaxed mb-10">
            It is hereby certified, on the basis of control carried out, that the declaration by the exporter is correct.
          </p>
          <div className="grid grid-cols-2 gap-16">
            <div>
              <div className="border-b-2 border-black mb-1"></div>
              <div className="text-[9px] text-gray-400">Competent Authority / Chamber of Commerce Stamp</div>
            </div>
            <div>
              <div className="border-b-2 border-black mb-1"></div>
              <div className="text-[9px] text-gray-400">Date &amp; Signature</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200 text-center text-[9px] text-gray-400 uppercase tracking-widest">
          Q Cargo Logistics · Hargeisa, Somaliland · qcargologistic@gmail.com · COO No: {cooNumber}
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
