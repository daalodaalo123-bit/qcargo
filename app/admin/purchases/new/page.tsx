'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, ArrowLeft, Link as LinkIcon, DollarSign, RefreshCcw, Search, User, Phone, Package, History } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NewPurchasePage() {
  const router = useRouter();
  const [exchangeRate, setExchangeRate] = useState(7.1);
  const [suppliers, setSuppliers] = useState<{ _id: string; name: string }[]>([]);
  const [customers, setCustomers] = useState<{ _id: string; name: string; phone?: string }[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [showCustList, setShowCustList] = useState(false);
  const [items, setItems] = useState([
    { productName: '', productUrl: '', quantity: 1, unitPriceCNY: 0 }
  ]);
  const [formData, setFormData] = useState({
    customerName: '', supplierName: '', paymentMethod: 'ZAAD', notes: ''
  });

  // Load the saved Yuan rate (from Finance Setup), the supplier directory,
  // the customer directory, and every past order (for the history lookup).
  useEffect(() => {
    fetch('/api/finance/settings').then(r => r.ok ? r.json() : null).then(s => {
      if (s?.rates?.CNY) setExchangeRate(s.rates.CNY);
    }).catch(() => {});
    fetch('/api/suppliers').then(r => r.ok ? r.json() : []).then(d => setSuppliers(Array.isArray(d) ? d : [])).catch(() => {});
    fetch('/api/customers').then(r => r.ok ? r.json() : []).then(d => setCustomers(Array.isArray(d) ? d : [])).catch(() => {});
    fetch('/api/sourcing').then(r => r.ok ? r.json() : []).then(d => setAllOrders(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  // Customers matching what's typed (for the live dropdown).
  const custQuery = formData.customerName.trim().toLowerCase();
  const matchingCustomers = custQuery
    ? customers.filter(c => c.name.toLowerCase().includes(custQuery)).slice(0, 6)
    : customers.slice(0, 6);

  // The selected customer's past orders (exact name match).
  const customerHistory = custQuery
    ? allOrders.filter(o => (o.customer || '').trim().toLowerCase() === custQuery)
    : [];
  const historyTotal = customerHistory.reduce((s, o) => s + (o.totalUSD || 0), 0);

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

    // Resolve the supplier against the directory — create it if it's new.
    const supplierName = formData.supplierName.trim() || 'Unknown Supplier';
    let supplierId: string | null = null;
    if (formData.supplierName.trim()) {
      const existing = suppliers.find(s => s.name.toLowerCase() === supplierName.toLowerCase());
      if (existing) supplierId = existing._id;
      else {
        try {
          const sres = await fetch('/api/suppliers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: supplierName }) });
          if (sres.ok) { const s = await sres.json(); supplierId = s._id; }
        } catch { /* non-fatal */ }
      }
    }
    const totalCNY = items.reduce((sum, item) => sum + (item.unitPriceCNY * item.quantity), 0);

    const payload = {
      orderNumber,
      customer: formData.customerName,
      supplier: supplierName,
      supplierId,
      items: itemsPayload,
      totalCNY: parseFloat(totalCNY.toFixed(2)),
      exchangeRate,
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
              <div className="relative">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Customer Name</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input type="text" className="search-input !pl-9" placeholder="Type to find a customer…" autoComplete="off"
                    value={formData.customerName}
                    onChange={(e) => { setFormData({...formData, customerName: e.target.value}); setShowCustList(true); }}
                    onFocus={() => setShowCustList(true)}
                    onBlur={() => setTimeout(() => setShowCustList(false), 150)} />
                </div>
                {showCustList && matchingCustomers.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full bg-[#0B0F19] border border-slate-800 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                    {matchingCustomers.map(c => {
                      const cOrders = allOrders.filter(o => (o.customer || '').trim().toLowerCase() === c.name.trim().toLowerCase());
                      return (
                        <button key={c._id} type="button"
                          onMouseDown={(e) => { e.preventDefault(); setFormData({ ...formData, customerName: c.name }); setShowCustList(false); }}
                          className="w-full text-left px-4 py-2.5 hover:bg-slate-800/60 border-b border-slate-800/40 last:border-0 flex items-center justify-between gap-2">
                          <span className="min-w-0">
                            <span className="block text-sm font-bold text-slate-100 truncate flex items-center gap-1.5"><User size={12} className="text-[#F15D38]" />{c.name}</span>
                            {c.phone && <span className="block text-[11px] font-bold text-slate-500 flex items-center gap-1 mt-0.5"><Phone size={10} />{c.phone}</span>}
                          </span>
                          <span className="text-[10px] font-black text-slate-500 shrink-0">{cOrders.length} order{cOrders.length === 1 ? '' : 's'}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Supplier (China)</label>
                <input type="text" list="supplier-list" className="search-input" placeholder="Pick a supplier or type a new one"
                  value={formData.supplierName} onChange={(e) => setFormData({...formData, supplierName: e.target.value})} />
                <datalist id="supplier-list">
                  {suppliers.map(s => <option key={s._id} value={s.name} />)}
                </datalist>
                <p className="text-[10px] text-slate-500 mt-1">New names are added to your Supplier Directory automatically.</p>
              </div>
            </div>
          </div>

          {/* Customer History — shows this customer's past purchases */}
          {customerHistory.length > 0 && (
            <div className="shipment-card">
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-800/40">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <History size={15} className="text-[#F15D38]" /> Customer History
                </h3>
                <span className="text-[11px] font-black text-slate-300">
                  {customerHistory.length} order{customerHistory.length === 1 ? '' : 's'} · <span className="text-emerald-400">${historyTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span> total
                </span>
              </div>
              <div className="space-y-3">
                {customerHistory.map((o) => (
                  <div key={o._id} className="p-4 bg-[#0B0F19] rounded-2xl border border-slate-800">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-xs font-black text-slate-100">{o.orderNumber}</span>
                      <span className="text-[10px] font-bold text-slate-500">{o.date}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {(o.items || []).map((it: any, i: number) => (
                        <span key={i} className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-300 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1">
                          <Package size={10} className="text-slate-500" /> {it.productName || 'Item'} <span className="text-slate-500">×{it.quantity}</span>
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-500">{o.supplier}</span>
                      <span className="text-emerald-400">${(o.totalUSD || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
