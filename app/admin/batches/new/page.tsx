'use client';

import { useState } from 'react';
import { 
  Plane, 
  Ship, 
  Save, 
  ArrowLeft,
  Calendar,
  MapPin,
  Scale,
  Box,
  Hash,
  User,
  Info,
  CheckCircle2,
  Package,
  TrendingUp,
  FileText
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NewBatchPage() {
  const router = useRouter();
  const [batchType, setBatchType] = useState<'AIR' | 'SEA'>('AIR');
  const [formData, setFormData] = useState({
    batchId: '',
    customerName: '',
    goods: '',
    origin: 'Guangzhou, China',
    destination: 'Hargeisa, Somaliland',
    estimatedArrival: '',
    totalWeight: 0,
    totalCBM: 0,
    totalCartons: 0,
    notes: ''
  });

  return (
    <div className="admin-container pb-20">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Cargo Consolidation</h1>
            <p className="text-slate-500 font-medium">Group individual shipments into a master flight or container</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest">
          <TrendingUp size={14} />
          Strategic Logistics
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Configuration Card */}
          <div className="shipment-card">
            <div className="flex items-center gap-2 mb-8 pb-4 border-b border-slate-50">
              <Package size={20} className="text-blue-600" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Consolidation Type</h3>
            </div>

            <div className="flex p-1.5 bg-slate-100 rounded-[1.5rem] mb-10">
              <button 
                onClick={() => setBatchType('AIR')}
                className={`flex-1 py-4 flex items-center justify-center gap-3 text-sm font-bold rounded-xl transition-all ${
                  batchType === 'AIR' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Plane size={20} />
                Air Flight
              </button>
              <button 
                onClick={() => setBatchType('SEA')}
                className={`flex-1 py-4 flex items-center justify-center gap-3 text-sm font-bold rounded-xl transition-all ${
                  batchType === 'SEA' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Ship size={20} />
                Sea Container
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">
                  {batchType === 'AIR' ? 'Flight Number' : 'Container Number'}
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 bg-slate-100 px-2 py-1 rounded text-[10px] font-black text-slate-500">
                    {batchType === 'AIR' ? 'FLT' : 'CTN'}
                  </div>
                  <input 
                    type="text" 
                    className="search-input !pl-14 font-bold" 
                    placeholder="e.g. 2024-001"
                    value={formData.batchId}
                    onChange={(e) => setFormData({...formData, batchId: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Customer / Agency</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="text" 
                    className="search-input !pl-12" 
                    placeholder="Who owns this batch?"
                    value={formData.customerName}
                    onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Logistics Details Card */}
          <div className="shipment-card">
            <div className="flex items-center gap-2 mb-8 pb-4 border-b border-slate-50">
              <MapPin size={20} className="text-blue-600" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Routing & Schedule</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Origin (City, Country)</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="text" 
                    className="search-input !pl-12 text-sm" 
                    value={formData.origin}
                    onChange={(e) => setFormData({...formData, origin: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Destination</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="text" 
                    className="search-input !pl-12 text-sm" 
                    value={formData.destination}
                    onChange={(e) => setFormData({...formData, destination: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Estimated Date of Arrival</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="date" 
                  className="search-input !pl-12"
                  value={formData.estimatedArrival}
                  onChange={(e) => setFormData({...formData, estimatedArrival: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Manifest Card */}
          <div className="shipment-card">
            <div className="flex items-center gap-2 mb-8 pb-4 border-b border-slate-50">
              <FileText size={20} className="text-blue-600" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Master Manifest</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Total Cartons</label>
                <div className="relative">
                  <Box className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="number" 
                    className="search-input !pl-12" 
                    value={formData.totalCartons}
                    onChange={(e) => setFormData({...formData, totalCartons: Number(e.target.value)})}
                  />
                </div>
              </div>
              {batchType === 'AIR' ? (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Gross Weight (KG)</label>
                  <div className="relative">
                    <Scale className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="number" 
                      className="search-input !pl-12 font-bold text-blue-600" 
                      value={formData.totalWeight}
                      onChange={(e) => setFormData({...formData, totalWeight: Number(e.target.value)})}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Total Volume (CBM)</label>
                  <div className="relative">
                    <Box className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="number" 
                      className="search-input !pl-12 font-bold text-emerald-600" 
                      value={formData.totalCBM}
                      onChange={(e) => setFormData({...formData, totalCBM: Number(e.target.value)})}
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">General Description</label>
              <textarea 
                className="search-input min-h-[120px] !p-6" 
                placeholder="List major items in this consolidation..."
                value={formData.goods}
                onChange={(e) => setFormData({...formData, goods: e.target.value})}
              ></textarea>
            </div>
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-8">
          <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-blue-900/20">
            <h3 className="text-xs font-bold opacity-40 uppercase tracking-widest mb-10">Batch Summary</h3>
            
            <div className="space-y-6 mb-12">
              <div className="flex justify-between items-center">
                <span className="text-sm opacity-50">Consolidation Type</span>
                <span className={`text-xs font-black px-3 py-1 rounded-full ${batchType === 'AIR' ? 'bg-blue-500' : 'bg-emerald-500'}`}>
                  {batchType} FREIGHT
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm opacity-50">Total Packages</span>
                <span className="font-bold text-xl">{formData.totalCartons} Cartons</span>
              </div>
              <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                <span className="text-sm opacity-50">Manifest Weight</span>
                <span className="text-2xl font-black text-blue-400">
                  {batchType === 'AIR' ? `${formData.totalWeight} KG` : `${formData.totalCBM} CBM`}
                </span>
              </div>
            </div>

            <button className={`w-full py-5 rounded-2xl font-black text-white shadow-lg transition-all flex items-center justify-center gap-3 ${
              batchType === 'AIR' ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/40' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40'
            }`}>
              <Save size={20} />
              Open Master Batch
            </button>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 text-blue-600 mb-4">
              <Info size={24} />
              <h4 className="font-bold text-slate-900">Consolidation Rule</h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              A Master Batch groups individual customer shipments into one logistics unit for easier tracking and manifest generation.
            </p>
          </div>

          <div className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-emerald-500 mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h4 className="font-bold text-slate-900 mb-2">Automated Tracking</h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed">
              Every shipment added to this batch will automatically inherit its tracking updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
