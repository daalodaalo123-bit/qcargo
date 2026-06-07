'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  User,
  Phone,
  Package,
  DollarSign,
  Upload,
  Send,
  ArrowLeft,
  X,
} from 'lucide-react';

interface QuotationItem {
  description: string;
  qty: string;
  price: string;
}

function lineTotal(item: QuotationItem): number {
  const qty = parseFloat(item.qty) || 0;
  const price = parseFloat(item.price) || 0;
  return qty * price;
}

export default function NewQuotation() {
  const router = useRouter();
  
  // State variables
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [items, setItems] = useState<QuotationItem[]>([{ description: '', qty: '1', price: '' }]);
  const [estimatedPrice, setEstimatedPrice] = useState('');
  const [freightType, setFreightType] = useState('SEA');

  // Sum item prices to estimate total price
  useEffect(() => {
    const total = items.reduce((acc, item) => acc + lineTotal(item), 0);
    if (total > 0) {
      setEstimatedPrice(total.toString());
    }
  }, [items]);

  const saveQuotation = async (status: 'SENT' | 'DRAFT'): Promise<{ id: string } | null> => {
    if (!customerName.trim()) { alert('Please enter a customer name'); return null; }
    if (!phone.trim()) { alert('Please enter a phone number'); return null; }

    const priceNum = parseFloat(estimatedPrice) || 0;
    const goodsText = items
      .filter(it => it.description.trim())
      .map(it => `${it.qty || 1}x ${it.description}`)
      .join(', ') || 'General Cargo';

    const payload = {
      customer: customerName, phone, goods: goodsText, price: priceNum,
      date: new Date().toISOString().split('T')[0], status,
      type: freightType.toUpperCase() as 'AIR' | 'SEA',
      items: items.filter(it => it.description.trim()).map(it => ({
        description: it.description.trim(),
        qty: parseFloat(it.qty) || 1,
        price: parseFloat(it.price) || 0,
      })),
    };

    try {
      const res = await fetch('/api/quotations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save quotation');
      }
      const saved: { _id?: string; id?: string } = await res.json();
      const id = saved._id ?? saved.id ?? '';
      return { id };
    } catch (err: unknown) {
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to save'}`);
      return null;
    }
  };

  const handleSend = async () => {
    if (!phone) {
      alert('Please enter a phone number');
      return;
    }

    const result = await saveQuotation('SENT');
    if (!result) return;

    try {
      const res = await fetch(`/api/quotations/${result.id}/send-whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.pdfSent ? 'Quotation PDF sent via WhatsApp!' : 'Quotation sent via WhatsApp (text + PDF link).');
      } else {
        alert('Saved but WhatsApp failed: ' + (data.error || 'Unknown error'));
      }
    } catch (e) {
      console.error(e);
      alert('Saved but failed to send WhatsApp message');
    }
    router.push('/admin/quotations');
  };

  const addItem = () => setItems([...items, { description: '', qty: '1', price: '' }]);
  
  const updateItem = (index: number, field: keyof QuotationItem, value: string) => {
    const newItems = items.map((item, i) => (i === index ? { ...item, [field]: value } : item));
    setItems(newItems);
  };
  
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  return (
    <div className="admin-container pb-20">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Create New Quotation</h1>
          <p className="text-sm text-slate-400">Generate a professional proposal for your customer</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Details Section */}
          <div className="shipment-card border border-slate-800 bg-[#131B2E]">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-800/40">
              <User size={18} className="text-[#F15D38]" />
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Customer Details</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Customer Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input 
                    type="text" 
                    className="search-input !pl-10" 
                    placeholder="e.g. Hassan Ahmed" 
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">WhatsApp / Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="text"
                    className="search-input !pl-10"
                    placeholder="+252 ..."
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Goods Details Section */}
          <div className="shipment-card border border-slate-800 bg-[#131B2E]">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-800/40">
              <Package size={18} className="text-[#F15D38]" />
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Description of Goods</h3>
            </div>
            <div className="hidden sm:grid sm:grid-cols-12 gap-4 mb-2 px-1">
              <span className="sm:col-span-6 text-[10px] font-bold text-slate-500 uppercase">Good Name</span>
              <span className="sm:col-span-2 text-[10px] font-bold text-slate-500 uppercase">Qty</span>
              <span className="sm:col-span-3 text-[10px] font-bold text-slate-500 uppercase">Price (USD)</span>
              <span className="sm:col-span-1" />
            </div>
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-4 mb-4 p-4 bg-[#0B0F19] rounded-xl border border-slate-800/80 items-end">
                <div className="sm:col-span-6">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 sm:sr-only">Good Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Solar panels"
                    className="search-input !py-2.5 min-w-0"
                    value={item.description}
                    onChange={e => updateItem(idx, 'description', e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 sm:sr-only">Qty</label>
                  <input
                    type="number"
                    min={1}
                    placeholder="1"
                    className="search-input !py-2.5 min-w-0"
                    value={item.qty}
                    onChange={e => updateItem(idx, 'qty', e.target.value)}
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 sm:sr-only">Price (USD)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0.00"
                    className="search-input !py-2.5 min-w-0"
                    value={item.price}
                    onChange={e => updateItem(idx, 'price', e.target.value)}
                  />
                </div>
                <div className="sm:col-span-1 flex sm:justify-end">
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    disabled={items.length === 1}
                    className="text-rose-500 hover:text-rose-400 p-2 hover:bg-rose-950/20 rounded-lg disabled:opacity-30 disabled:pointer-events-none"
                    aria-label="Remove item"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            ))}
            <button 
              type="button" 
              onClick={addItem} 
              className="w-full py-2.5 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl mt-4 font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition-colors"
            >
              + Add Another Item
            </button>
          </div>

          {/* Upload photos */}
          <div className="shipment-card border border-slate-800 bg-[#131B2E]">
            <div className="p-8 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-950/30 text-center hover:border-[#F15D38]/50 hover:bg-[#F15D38]/5 transition-all cursor-pointer group">
              <div className="w-12 h-12 bg-[#131B2E] rounded-xl shadow-sm border border-slate-800 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Upload size={20} className="text-[#F15D38]" />
              </div>
              <p className="text-sm font-bold text-slate-300">Upload Product Photos</p>
              <p className="text-xs text-slate-500 mt-1">Drag and click to browse (Max 5 images)</p>
              <input type="file" multiple className="hidden" id="photo-upload" />
            </div>
          </div>
        </div>

        {/* Pricing & Actions Sidebar */}
        <div className="space-y-6">
          <div className="bg-[#131B2E] p-8 rounded-[2rem] border border-slate-800 shadow-xl">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Price & Logistics</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Estimated Price (USD)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="number" 
                    className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-[#F15D38]/50" 
                    placeholder="0.00" 
                    value={estimatedPrice}
                    onChange={e => setEstimatedPrice(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Freight Type</label>
                <select 
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl py-3 px-4 text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-[#F15D38]/50"
                  value={freightType}
                  onChange={e => setFreightType(e.target.value)}
                >
                  <option value="SEA">Sea Freight (30-45 Days)</option>
                  <option value="AIR">Air Freight (2 Weeks)</option>
                </select>
              </div>
              <div className="pt-6 border-t border-slate-800/40 space-y-3">
                <button
                  onClick={async () => {
                    const saved = await saveQuotation('SENT');
                    if (saved) {
                      alert(`Quotation successfully created for ${customerName}!`);
                      router.push('/admin/quotations');
                    }
                  }}
                  className="w-full py-4 bg-[#F15D38] hover:bg-[#d64420] text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#F15D38]/20"
                >
                  <Send size={18} />
                  Generate & Save
                </button>
                <button 
                  onClick={handleSend} 
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/20"
                >
                  <Send size={18} />
                  Send WhatsApp
                </button>
              </div>
            </div>
          </div>
          <div className="bg-[#F15D38]/10 p-6 rounded-2xl border border-[#F15D38]/20">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-[#F15D38] rounded-lg text-white mt-1">
                <FileText size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-200">Pro Tip</p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">Adding clear photos and a detailed description helps the customer make a decision faster.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
