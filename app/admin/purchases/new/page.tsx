'use client';

import { useState } from 'react';
import { Plus, Trash2, Save, ArrowLeft, Link as LinkIcon, DollarSign, RefreshCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NewPurchasePage() {
  const router = useRouter();
  const [exchangeRate, setExchangeRate] = useState(7.2);
  const [items, setItems] = useState([
    { productName: '', productUrl: '', quantity: 1, unitPriceCNY: 0 }
  ]);
  const [formData, setFormData] = useState({
    customerName: '', supplierName: '', paymentMethod: 'ZAAD', notes: ''
  });

  const addItem = () => setItems([...items, { productName: '', productUrl: '', quantity: 1, unitPriceCNY: 0 }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));
  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const totalUSD = items.reduce((sum, item) => sum + ((item.unitPriceCNY * item.quantity) / exchangeRate), 0);

  const handleSave = async () => {
    if (!formData.customerName.trim()) { alert('Please enter a customer name'); return; }
    
    const orderNumber = `PUR-${new Date().getFullYear()}-${Date.now().toString().substring(9)}`;
    const itemsPayload = items.map(item => ({
      productName: item.productName,
      productUrl: item.productUrl,
      quantity: item.quantity,
      unitPriceCNY: item.unitPriceCNY,
      totalUSD: parseFloat(((item.unitPriceCNY * item.quantity) / exchangeRate).toFixed(2))
    }));

    const payload = {
      orderNumber,
      customer: formData.customerName,
      supplier: formData.supplierName || 'Unknown Supplier',
      items: itemsPayload,
      totalUSD: parseFloat(totalUSD.toFixed(2)),
      paidUSD: 0,
      paymentStatus: 'UNPAID',
      status: 'ORDERED',
      paymentMethod: formData.paymentMethod,
      notes: formData.notes,
      date: new Date().toISOString().split('T')[0]
    };

    try {
      const res = await fetch('/api/sourcing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create order');
      }
      alert(`Order ${orderNumber} created successfully!`);
      router.push('/admin/purchases');
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="admin-container pb-20">
      <div className="flex items-center gap-4 mb-10">
        <button onClick={() => router.back()} className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight">New Sourcing Order</h1>
          <p className="text-slate-400 font-medium">Create a new purchase order for a customer from China</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Client Details */}
          <div className="shipment-card">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 pb-4 border-b border-slate-800/40">Client Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Customer Name</label>
                <input type="text" className="search-input" placeholder="e.g. Mustafe Ismail"
                  value={formData.customerName} onChange={(e) => setFormData({...formData, customerName: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Supplier Name (China)</label>
                <input type="text" className="search-input" placeholder="e.g. Guangzhou Electronics"
                  value={formData.supplierName} onChange={(e) => setFormData({...formData, supplierName: e.target.value})} />
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="shipment-card">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800/40">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Order Items</h3>
              <div className="flex items-center gap-2 bg-[#0B0F19] px-3 py-1.5 rounded-xl border border-slate-800">
                <RefreshCcw size={14} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-400">Rate: 1$ =</span>
                <input type="number" className="w-14 bg-transparent text-xs font-bold text-[#F15D38] focus:outline-none"
                  value={exchangeRate} onChange={(e) => setExchangeRate(Number(e.target.value))} />
                <span className="text-xs font-bold text-slate-400">Yuan</span>
              </div>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="p-5 bg-[#0B0F19] rounded-2xl border border-slate-800 relative group">
                  <button onClick={() => removeItem(index)}
                    className="absolute -right-2 -top-2 p-1.5 bg-[#131B2E] border border-slate-700 text-rose-500 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={14} />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Product Name</label>
                      <input type="text" className="search-input !py-2.5" placeholder="What are we buying?"
                        value={item.productName} onChange={(e) => updateItem(index, 'productName', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Product URL</label>
                      <div className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                        <input type="text" className="search-input !py-2.5 !pl-9" placeholder="Alibaba / Taobao link"
                          value={item.productUrl} onChange={(e) => updateItem(index, 'productUrl', e.target.value)} />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Qty</label>
                      <input type="number" className="search-input !py-2.5" value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Price (¥ Yuan)</label>
                      <input type="number" className="search-input !py-2.5" value={item.unitPriceCNY}
                        onChange={(e) => updateItem(index, 'unitPriceCNY', Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Total (USD)</label>
                      <div className="search-input !py-2.5 text-emerald-400 font-black flex items-center gap-1">
                        <DollarSign size={13} />
                        {((item.unitPriceCNY * item.quantity) / exchangeRate).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={addItem}
              className="w-full mt-4 py-3 border-2 border-dashed border-slate-800 rounded-2xl text-slate-500 text-sm font-bold hover:border-[#F15D38] hover:text-[#F15D38] transition-all flex items-center justify-center gap-2">
              <Plus size={18} /> Add Another Item
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-[#131B2E] border border-slate-800 p-8 rounded-[2.5rem] shadow-xl">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Order Summary</h3>
            <div className="space-y-5 mb-8">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Total Items</span>
                <span className="font-bold text-slate-100">{items.length}</span>
              </div>
              <div className="pt-4 border-t border-slate-800/40 flex justify-between items-center">
                <span className="text-lg font-bold text-slate-200">Grand Total</span>
                <span className="text-2xl font-black text-[#F15D38]">${totalUSD.toFixed(2)}</span>
              </div>
            </div>
            <button onClick={handleSave} className="w-full py-4 bg-[#F15D38] hover:bg-[#d64420] text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#F15D38]/20">
              <Save size={18} /> Save Order
            </button>
          </div>

          {/* Payment */}
          <div className="shipment-card">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-5">Payment Method</h3>
            <select className="search-input mb-4" value={formData.paymentMethod}
              onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}>
              <option value="ZAAD">Zaad Service</option>
              <option value="EDAHAB">E-Dahab</option>
              <option value="WAAFI">Waafi</option>
              <option value="CASH">Cash Payment</option>
              <option value="ALIPAY">AliPay (China)</option>
            </select>
            <textarea className="search-input min-h-[100px]" placeholder="Additional notes or payment references..."
              value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
          </div>
        </div>
      </div>
    </div>
  );
}
