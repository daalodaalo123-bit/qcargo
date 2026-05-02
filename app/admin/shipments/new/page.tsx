'use client';

import { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft,
  DollarSign,
  Package,
  Hash,
  Scale,
  Box,
  User,
  Info,
  Plane,
  Truck,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NewShipmentPage() {
  const router = useRouter();
  const [shipmentType, setShipmentType] = useState<'AIR' | 'SEA'>('AIR');
  const [courierPackages, setCourierPackages] = useState([
    { courier: '', trackingNumber: '', goods: '', qty: 1 }
  ]);
  const [formData, setFormData] = useState({
    customerName: '',
    batchId: '',
    weight: 0,
    cbm: 0,
    rate: 0,
    customs: 0,
    discount: 0,
    paymentMethod: 'ZAAD',
    paidAmount: 0,
    notes: ''
  });

  const addPackage = () => {
    setCourierPackages([...courierPackages, { courier: '', trackingNumber: '', goods: '', qty: 1 }]);
  };

  const removePackage = (index: number) => {
    setCourierPackages(courierPackages.filter((_, i) => i !== index));
  };

  const freightTotal = shipmentType === 'AIR' 
    ? formData.weight * formData.rate 
    : formData.cbm * formData.rate;

  const grandTotal = freightTotal + formData.customs - formData.discount;
  const balance = grandTotal - formData.paidAmount;

  return (
    <div className="admin-container pb-20">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">New Shipment Entry</h1>
          <p className="text-sm text-slate-500">Record a new customer shipment and calculate freight</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info Card */}
          <div className="shipment-card">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-50">
              <User size={18} className="text-blue-600" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Customer & Logistics</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Customer Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input 
                    type="text" 
                    className="search-input !pl-10" 
                    placeholder="Enter customer name"
                    value={formData.customerName}
                    onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Assigned Batch</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input 
                    type="text" 
                    className="search-input !pl-10 font-mono" 
                    placeholder="e.g. FLT-2024-001"
                    value={formData.batchId}
                    onChange={(e) => setFormData({...formData, batchId: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="flex p-1 bg-slate-100 rounded-2xl mb-8">
              <button 
                onClick={() => setShipmentType('AIR')}
                className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-bold rounded-xl transition-all ${
                  shipmentType === 'AIR' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Plane size={18} />
                Air Cargo
              </button>
              <button 
                onClick={() => setShipmentType('SEA')}
                className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-bold rounded-xl transition-all ${
                  shipmentType === 'SEA' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Truck size={18} />
                Sea Cargo
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {shipmentType === 'AIR' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Weight (KG)</label>
                  <div className="relative">
                    <Scale className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input 
                      type="number" 
                      className="search-input !pl-10" 
                      value={formData.weight}
                      onChange={(e) => setFormData({...formData, weight: Number(e.target.value)})}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Volume (CBM)</label>
                  <div className="relative">
                    <Box className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input 
                      type="number" 
                      className="search-input !pl-10" 
                      value={formData.cbm}
                      onChange={(e) => setFormData({...formData, cbm: Number(e.target.value)})}
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Rate per Unit ($)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input 
                    type="number" 
                    className="search-input !pl-10 font-bold text-blue-600" 
                    value={formData.rate}
                    onChange={(e) => setFormData({...formData, rate: Number(e.target.value)})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Customs & Extra</label>
                <div className="relative">
                  <Plus className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input 
                    type="number" 
                    className="search-input !pl-10" 
                    value={formData.customs}
                    onChange={(e) => setFormData({...formData, customs: Number(e.target.value)})}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Courier Packages Card */}
          <div className="shipment-card">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-50">
              <div className="flex items-center gap-2">
                <Package size={18} className="text-blue-600" />
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Courier Packages</h3>
              </div>
              <button 
                onClick={addPackage}
                className="btn py-2 px-4 bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold flex items-center gap-2"
              >
                <Plus size={14} />
                Add Package
              </button>
            </div>

            <div className="space-y-4">
              {courierPackages.map((pkg, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 relative group">
                  <button 
                    onClick={() => removePackage(index)}
                    className="absolute -right-2 -top-2 p-1.5 bg-white border border-slate-200 text-rose-500 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Courier</label>
                    <input 
                      type="text" 
                      className="search-input !py-2 !px-3 bg-white" 
                      placeholder="SF / ZTO / EMS"
                      value={pkg.courier}
                      onChange={(e) => {
                        const newPkgs = [...courierPackages];
                        newPkgs[index].courier = e.target.value;
                        setCourierPackages(newPkgs);
                      }}
                    />
                  </div>
                  <div className="md:col-span-5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tracking Number</label>
                    <div className="relative">
                      <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
                      <input 
                        type="text" 
                        className="search-input !py-2 !pl-8 bg-white" 
                        placeholder="Chinese Tracking ID"
                        value={pkg.trackingNumber}
                        onChange={(e) => {
                          const newPkgs = [...courierPackages];
                          newPkgs[index].trackingNumber = e.target.value;
                          setCourierPackages(newPkgs);
                        }}
                      />
                    </div>
                  </div>
                  <div className="md:col-span-4">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Goods Description</label>
                    <input 
                      type="text" 
                      className="search-input !py-2 !px-3 bg-white" 
                      placeholder="What is in the box?"
                      value={pkg.goods}
                      onChange={(e) => {
                        const newPkgs = [...courierPackages];
                        newPkgs[index].goods = e.target.value;
                        setCourierPackages(newPkgs);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar / Financials */}
        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl text-white">
            <h3 className="text-xs font-bold opacity-40 uppercase tracking-widest mb-8">Freight Summary</h3>
            
            <div className="space-y-5 mb-10">
              <div className="flex justify-between items-center">
                <span className="text-sm opacity-60">Freight Charges</span>
                <span className="font-bold text-lg">${freightTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm opacity-60">Customs & Extra</span>
                <span className="font-bold text-emerald-400">+${formData.customs.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-rose-400">
                <span className="text-sm opacity-60 font-bold">Discount</span>
                <span className="font-bold">-${formData.discount.toFixed(2)}</span>
              </div>
              <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                <span className="text-lg font-bold">Grand Total</span>
                <span className="text-3xl font-black text-blue-400">${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-4">
              <button className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-blue-900/30">
                <Save size={20} />
                Save Shipment
              </button>
              <button className="w-full py-3 bg-white/5 hover:bg-white/10 text-white/50 rounded-2xl text-xs font-bold transition-all uppercase tracking-widest">
                Save as Draft
              </button>
            </div>
          </div>

          {/* Payment Card */}
          <div className="shipment-card">
            <div className="flex items-center gap-2 mb-6">
              <DollarSign size={18} className="text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Payment Details</h3>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Method</label>
                <select 
                  className="search-input !py-3"
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                >
                  <option value="ZAAD">Zaad Service</option>
                  <option value="EDAHAB">E-Dahab</option>
                  <option value="WAAFI">Waafi</option>
                  <option value="CASH">Cash Payment</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Amount Paid ($)</label>
                <input 
                  type="number" 
                  className="search-input !py-3 font-black text-emerald-600 text-lg" 
                  value={formData.paidAmount}
                  onChange={(e) => setFormData({...formData, paidAmount: Number(e.target.value)})}
                />
              </div>
              <div className={`p-6 rounded-[2rem] flex flex-col gap-1 ${balance <= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                <p className="text-[10px] font-bold uppercase opacity-60 tracking-widest">Current Balance</p>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-black">${Math.max(0, balance).toFixed(2)}</p>
                  {balance <= 0 ? <CheckCircle2 size={32} className="opacity-20" /> : <AlertCircle size={32} className="opacity-20" />}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
