'use client';

import { 
  FileText, 
  User, 
  Phone, 
  Package, 
  DollarSign, 
  Upload, 
  Eye, 
  Send,
  ArrowLeft
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NewQuotation() {
  const router = useRouter();

  return (
    <div className="admin-container pb-20">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Create New Quotation</h1>
          <p className="text-sm text-slate-500">Generate a professional PDF quote for your customer</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Details Section */}
          <div className="shipment-card">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-50">
              <User size={18} className="text-blue-600" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Customer Details</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Customer Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input 
                    type="text" 
                    className="search-input !pl-10" 
                    placeholder="e.g. Hassan Ahmed" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">WhatsApp / Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input 
                    type="text" 
                    className="search-input !pl-10" 
                    placeholder="+252 ..." 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Goods Details Section */}
          <div className="shipment-card">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-50">
              <Package size={18} className="text-blue-600" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Description of Goods</h3>
            </div>
            
            <textarea 
              className="search-input min-h-[150px] !p-4" 
              placeholder="Describe the items clearly for the quotation... For example: 50 Cartons of mixed electronics, 20 Sets of kitchenware..."
            ></textarea>
            
            <div className="mt-6 p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer group">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Upload size={20} className="text-blue-600" />
              </div>
              <p className="text-sm font-bold text-slate-700">Upload Product Photos</p>
              <p className="text-xs text-slate-400 mt-1">Drag and drop or click to browse (Max 5 images)</p>
              <input type="file" multiple className="hidden" id="photo-upload" />
            </div>
          </div>
        </div>

        {/* Pricing & Actions Sidebar */}
        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-[2rem] shadow-xl text-white">
            <h3 className="text-xs font-bold opacity-50 uppercase tracking-widest mb-6">Price & Logistics</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-white/60 uppercase mb-2">Estimated Price (USD)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                  <input 
                    type="number" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50" 
                    placeholder="0.00" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/60 uppercase mb-2">Freight Type</label>
                <select className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none">
                  <option value="sea">Sea Freight (1-2 months)</option>
                  <option value="air">Air Freight (5-7 days)</option>
                </select>
              </div>

              <div className="pt-6 border-t border-white/10">
                <button className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20">
                  <Send size={18} />
                  Generate & Send
                </button>
                <button className="w-full py-3 mt-3 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all">
                  <Eye size={16} />
                  Preview PDF
                </button>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-600 rounded-lg text-white mt-1">
                <FileText size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-blue-900">Pro Tip</p>
                <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                  Adding clear photos and a detailed description helps the customer make a decision faster.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
