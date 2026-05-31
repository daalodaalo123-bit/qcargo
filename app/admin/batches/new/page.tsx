'use client';

import { useState } from 'react';
import { 
  Plane, Ship, Save, ArrowLeft, Calendar, MapPin,
  Scale, Box, Hash, User, Info, CheckCircle2, Package, TrendingUp, FileText
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NewBatchPage() {
  const router = useRouter();
  const [batchType, setBatchType] = useState<'AIR' | 'SEA'>('AIR');
  const [formData, setFormData] = useState({
    batchId: '', customerName: '', goods: '',
    origin: 'Guangzhou, China', destination: 'Hargeisa, Somaliland',
    estimatedArrival: '', totalWeight: 0, totalCBM: 0, totalCartons: 0, notes: ''
  });

  const handleSave = async () => {
    if (!formData.batchId.trim()) {
      alert('Please enter a Flight or Container number');
      return;
    }
    const formattedBatchId = `${batchType === 'AIR' ? 'FLT' : 'CTN'}-${formData.batchId}`;
    const weightVal = batchType === 'AIR' ? `${formData.totalWeight} KG` : `${formData.totalCBM} CBM`;
    
    try {
      const res = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: formattedBatchId,
          type: batchType,
          origin: formData.origin,
          destination: formData.destination,
          status: 'IN_TRANSIT',
          shipments: 0,
          weight: weightVal,
          arrival: formData.estimatedArrival
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create batch');
      }

      alert(`Batch ${formattedBatchId} created successfully!`);
      router.push('/admin/batches');
    } catch (err: any) {
      console.error(err);
      alert(`Error creating batch: ${err.message}`);
    }
  };

  return (
    <div className="admin-container pb-20">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-100 tracking-tight">Cargo Consolidation</h1>
            <p className="text-slate-400 font-medium">Group individual shipments into a master flight or container</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-[#F15D38]/10 text-[#F15D38] border border-[#F15D38]/20 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest">
          <TrendingUp size={14} />
          Strategic Logistics
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          {/* Type Selection */}
          <div className="shipment-card">
            <div className="flex items-center gap-2 mb-8 pb-4 border-b border-slate-800/40">
              <Package size={20} className="text-[#F15D38]" />
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Consolidation Type</h3>
            </div>
            <div className="flex p-1.5 bg-[#0B0F19] rounded-2xl mb-8 border border-slate-800">
              <button onClick={() => setBatchType('AIR')}
                className={`flex-1 py-4 flex items-center justify-center gap-3 text-sm font-bold rounded-xl transition-all ${
                  batchType === 'AIR' ? 'bg-[#F15D38] text-white shadow-lg shadow-[#F15D38]/20' : 'text-slate-400 hover:text-slate-200'
                }`}>
                <Plane size={20} /> Air Flight
              </button>
              <button onClick={() => setBatchType('SEA')}
                className={`flex-1 py-4 flex items-center justify-center gap-3 text-sm font-bold rounded-xl transition-all ${
                  batchType === 'SEA' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40' : 'text-slate-400 hover:text-slate-200'
                }`}>
                <Ship size={20} /> Sea Container
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">
                  {batchType === 'AIR' ? 'Flight Number' : 'Container Number'}
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 bg-slate-900 px-2 py-1 rounded text-[10px] font-black text-slate-400 border border-slate-800">
                    {batchType === 'AIR' ? 'FLT' : 'CTN'}
                  </div>
                  <input type="text" className="search-input !pl-16 font-bold" placeholder="e.g. 2026-001"
                    value={formData.batchId} onChange={(e) => setFormData({...formData, batchId: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Customer / Agency</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input type="text" className="search-input !pl-12" placeholder="Who owns this batch?"
                    value={formData.customerName} onChange={(e) => setFormData({...formData, customerName: e.target.value})} />
                </div>
              </div>
            </div>
          </div>

          {/* Routing */}
          <div className="shipment-card">
            <div className="flex items-center gap-2 mb-8 pb-4 border-b border-slate-800/40">
              <MapPin size={20} className="text-[#F15D38]" />
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Routing & Schedule</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Origin</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input type="text" className="search-input !pl-12" value={formData.origin}
                    onChange={(e) => setFormData({...formData, origin: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Destination</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input type="text" className="search-input !pl-12" value={formData.destination}
                    onChange={(e) => setFormData({...formData, destination: e.target.value})} />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Estimated Date of Arrival</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input type="date" className="search-input !pl-12" value={formData.estimatedArrival}
                  onChange={(e) => setFormData({...formData, estimatedArrival: e.target.value})} />
              </div>
            </div>
          </div>

          {/* Manifest */}
          <div className="shipment-card">
            <div className="flex items-center gap-2 mb-8 pb-4 border-b border-slate-800/40">
              <FileText size={20} className="text-[#F15D38]" />
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Master Manifest</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Total Cartons</label>
                <div className="relative">
                  <Box className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                  <input type="text" className="search-input !pl-12 opacity-60 cursor-not-allowed" value="0 (Auto-calculated)" disabled />
                </div>
              </div>
              {batchType === 'AIR' ? (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Gross Weight (KG)</label>
                  <div className="relative">
                    <Scale className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                    <input type="text" className="search-input !pl-12 font-bold text-slate-500 opacity-60 cursor-not-allowed" value="0 KG (Auto-calculated)" disabled />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Total Volume (CBM)</label>
                  <div className="relative">
                    <Box className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                    <input type="text" className="search-input !pl-12 font-bold text-slate-500 opacity-60 cursor-not-allowed" value="0.00 CBM (Auto-calculated)" disabled />
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">General Description</label>
              <textarea className="search-input min-h-[120px] !p-4" placeholder="Description will accumulate automatically from assigned shipments..."
                value={formData.goods} onChange={(e) => setFormData({...formData, goods: e.target.value})} />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <div className="bg-[#131B2E] border border-slate-800 rounded-[2.5rem] p-10 shadow-xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-10">Batch Summary</h3>
            <div className="space-y-6 mb-12">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Type</span>
                <span className={`text-xs font-black px-3 py-1 rounded-full ${batchType === 'AIR' ? 'bg-[#F15D38]/10 text-[#F15D38] border border-[#F15D38]/20' : 'bg-emerald-950/30 text-emerald-400 border border-emerald-800/20'}`}>
                  {batchType} FREIGHT
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Total Packages</span>
                <span className="font-bold text-slate-100">{formData.totalCartons} Cartons</span>
              </div>
              <div className="pt-6 border-t border-slate-800/40 flex justify-between items-center">
                <span className="text-sm text-slate-400">Manifest Weight</span>
                <span className="text-2xl font-black text-[#F15D38]">
                  {batchType === 'AIR' ? `${formData.totalWeight} KG` : `${formData.totalCBM} CBM`}
                </span>
              </div>
            </div>
            <button onClick={handleSave} className="w-full py-5 bg-[#F15D38] hover:bg-[#d64420] rounded-2xl font-black text-white shadow-lg shadow-[#F15D38]/20 transition-all flex items-center justify-center gap-3">
              <Save size={20} /> Open Master Batch
            </button>
          </div>

          <div className="bg-[#131B2E] border border-slate-800 rounded-[2.5rem] p-8">
            <div className="flex items-center gap-3 text-[#F15D38] mb-4">
              <Info size={24} />
              <h4 className="font-bold text-slate-200">Consolidation Rule</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              A Master Batch groups individual customer shipments into one logistics unit for easier tracking and manifest generation.
            </p>
          </div>

          <div className="p-8 rounded-[2.5rem] bg-[#131B2E]/50 border border-slate-800 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-[#131B2E] rounded-2xl border border-slate-800 flex items-center justify-center text-emerald-400 mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h4 className="font-bold text-slate-200 mb-2">Automated Tracking</h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed">
              Every shipment added to this batch will automatically inherit its tracking updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
