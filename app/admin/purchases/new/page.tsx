'use client';

import { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft,
  Link as LinkIcon,
  DollarSign,
  RefreshCcw
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NewPurchasePage() {
  const router = useRouter();
  const [exchangeRate, setExchangeRate] = useState(7.2);
  const [items, setItems] = useState([
    { productName: '', productUrl: '', quantity: 1, unitPriceCNY: 0 }
  ]);
  const [formData, setFormData] = useState({
    customerName: '',
    supplierName: '',
    paymentMethod: 'ZAAD',
    notes: ''
  });

  const addItem = () => {
    setItems([...items, { productName: '', productUrl: '', quantity: 1, unitPriceCNY: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const totalUSD = items.reduce((sum, item) => {
    return sum + ((item.unitPriceCNY * item.quantity) / exchangeRate);
  }, 0);

  return (
    <div className="admin-container pb-20">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">New Sourcing Order</h1>
          <p className="text-sm text-slate-500">Create a new purchase order for a customer from China</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Supplier */}
          <div className="shipment-card">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Client Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Customer Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Mustafe Ismail"
                  value={formData.customerName}
                  onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Supplier Name (China)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Guangzhou Electronics"
                  value={formData.supplierName}
                  onChange={(e) => setFormData({...formData, supplierName: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Order Items</h3>
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                <RefreshCcw size={14} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-600">Rate: 1$ = </span>
                <input 
                  type="number" 
                  className="w-12 bg-transparent text-xs font-bold text-blue-600 focus:outline-none"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(Number(e.target.value))}
                />
                <span className="text-xs font-bold text-slate-600">Yuan</span>
              </div>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="p-4 bg-slate-50 rounded-xl border border-slate-100 relative group">
                  <button 
                    onClick={() => removeItem(index)}
                    className="absolute -right-2 -top-2 p-1.5 bg-white border border-slate-200 text-rose-500 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Product Name</label>
                      <input 
                        type="text" 
                        className="form-input bg-white" 
                        placeholder="What are we buying?"
                        value={item.productName}
                        onChange={(e) => updateItem(index, 'productName', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Product URL (Link)</label>
                      <div className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                        <input 
                          type="text" 
                          className="form-input bg-white pl-9" 
                          placeholder="Alibaba/Taobao Link"
                          value={item.productUrl}
                          onChange={(e) => updateItem(index, 'productUrl', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Qty</label>
                      <input 
                        type="number" 
                        className="form-input bg-white" 
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Price (Yuan)</label>
                      <input 
                        type="number" 
                        className="form-input bg-white" 
                        value={item.unitPriceCNY}
                        onChange={(e) => updateItem(index, 'unitPriceCNY', Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Total (USD)</label>
                      <div className="form-input bg-slate-100 text-slate-500 flex items-center gap-1">
                        <DollarSign size={12} />
                        {((item.unitPriceCNY * item.quantity) / exchangeRate).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={addItem}
              className="w-full mt-4 py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-sm font-bold hover:border-blue-500 hover:text-blue-500 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Add Another Item
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-blue-600 p-6 rounded-2xl shadow-lg shadow-blue-200 text-white">
            <h3 className="text-sm font-bold opacity-60 uppercase tracking-widest mb-6">Order Summary</h3>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center opacity-80">
                <span className="text-sm">Total Items</span>
                <span className="font-bold">{items.length}</span>
              </div>
              <div className="flex justify-between items-center text-xl font-bold">
                <span>Grand Total</span>
                <span>${totalUSD.toFixed(2)}</span>
              </div>
            </div>

            <button className="w-full py-4 bg-white text-blue-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors shadow-lg">
              <Save size={18} />
              Save Order
            </button>
          </div>

          {/* Payment */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Payment Method</h3>
            <select 
              className="form-input mb-4"
              value={formData.paymentMethod}
              onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
            >
              <option value="ZAAD">Zaad Service</option>
              <option value="EDAHAB">E-Dahab</option>
              <option value="WAAFI">Waafi</option>
              <option value="CASH">Cash Payment</option>
              <option value="ALIPAY">AliPay (China)</option>
            </select>
            <textarea 
              className="form-input min-h-[100px]" 
              placeholder="Additional notes or payment references..."
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            ></textarea>
          </div>
        </div>
      </div>
    </div>
  );
}
