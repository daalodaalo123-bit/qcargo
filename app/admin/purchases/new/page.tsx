'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, ArrowLeft, Link as LinkIcon, DollarSign, RefreshCcw, Search, User, Phone, ClipboardCheck, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NewPurchasePage() {
  const router = useRouter();
  const [exchangeRate, setExchangeRate] = useState(7.1);
  const [suppliers, setSuppliers] = useState<{ _id: string; name: string }[]>([]);
  const [customers, setCustomers] = useState<{ _id: string; name: string; phone?: string }[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [showCustList, setShowCustList] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
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
    fetch('/api/invoices').then(r => r.ok ? r.json() : []).then(d => setInvoices(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  // Phone comparison that survives spaces, dashes and country codes.
  const phonesMatch = (a?: string, b?: string) => {
    const da = (a || '').replace(/\D/g, '');
    const db = (b || '').replace(/\D/g, '');
    if (da.length < 6 || db.length < 6) return false;
    return da.endsWith(db) || db.endsWith(da);
  };

  // A customer's PAID invoices (matched by name, phone as backup).
  const paidInvoicesFor = (name: string, phone?: string) => {
    const n = name.trim().toLowerCase();
    if (!n) return [];
    return invoices.filter(inv =>
      inv.paymentStatus === 'PAID' &&
      ((inv.customerName || '').trim().toLowerCase() === n || phonesMatch(inv.customerPhone, phone))
    );
  };

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

  // The selected customer's PAID invoices — his real, settled orders.
  const selectedCustomer = custQuery ? customers.find(c => c.name.trim().toLowerCase() === custQuery) : undefined;
  const paidInvoices = paidInvoicesFor(formData.customerName, selectedCustomer?.phone);
  const paidInvoicesTotal = paidInvoices.reduce((s, inv) => s + (inv.totalAmount || 0), 0);

  const addItem = () => setItems([...items, { productName: '', productUrl: '', quantity: 1, unitPriceCNY: 0 }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));
  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  // Load a past order's products into the form (re-order from history).
  const loadOrderIntoPurchase = (order: any) => {
    const lines = (order.items || []).map((it: any) => ({
      productName: it.productName || '',
      productUrl: it.productUrl || '',
      quantity: it.quantity || 1,
      unitPriceCNY: it.unitPriceCNY || 0,
    }));
    setItems(lines.length > 0 ? lines : [{ productName: '', productUrl: '', quantity: 1, unitPriceCNY: 0 }]);
    if (order.supplier && order.supplier !== 'Unknown Supplier') setFormData(prev => ({ ...prev, supplierName: order.supplier }));
    setSelectedOrderId(order._id);
    setSelectedInvoiceId(null);
  };

  // Load a paid invoice's products into the form. The invoice price is the
  // selling price in USD, so the Yuan buy price is left at 0 to be typed in.
  const loadInvoiceIntoPurchase = (inv: any) => {
    const lines = (inv.items || []).map((it: any) => ({
      productName: it.description || '',
      productUrl: '',
      quantity: it.qty || 1,
      unitPriceCNY: 0,
    }));
    setItems(lines.length > 0 ? lines : [{ productName: '', productUrl: '', quantity: 1, unitPriceCNY: 0 }]);
    setSelectedInvoiceId(inv._id);
    setSelectedOrderId(null);
  };

  const clearLoadedOrder = () => {
    setSelectedOrderId(null);
    setSelectedInvoiceId(null);
    setItems([{ productName: '', productUrl: '', quantity: 1, unitPriceCNY: 0 }]);
  };

  // Friendly status badge so you can tell which orders he already received.
  const statusBadge = (status: string) => {
    switch (status) {
      case 'SHIPPED': return { label: 'Shipped', cls: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/30' };
      case 'IN_WAREHOUSE': return { label: 'In Warehouse', cls: 'bg-sky-950/40 text-sky-400 border-sky-800/30' };
      default: return { label: 'Ordered', cls: 'bg-amber-950/40 text-amber-400 border-amber-800/30' };
    }
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
                      const cPaid = paidInvoicesFor(c.name, c.phone);
                      return (
                        <button key={c._id} type="button"
                          onMouseDown={(e) => { e.preventDefault(); setFormData({ ...formData, customerName: c.name }); setShowCustList(false); }}
                          className="w-full text-left px-4 py-2.5 hover:bg-slate-800/60 border-b border-slate-800/40 last:border-0 flex items-center justify-between gap-2">
                          <span className="min-w-0">
                            <span className="block text-sm font-bold text-slate-100 truncate flex items-center gap-1.5"><User size={12} className="text-[#F15D38]" />{c.name}</span>
                            {c.phone && <span className="block text-[11px] font-bold text-slate-500 flex items-center gap-1 mt-0.5"><Phone size={10} />{c.phone}</span>}
                          </span>
                          <span className={`text-[10px] font-black shrink-0 ${cPaid.length > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>{cPaid.length} paid order{cPaid.length === 1 ? '' : 's'}</span>
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

            {/* Customer's PAID invoices — load his settled products into this purchase */}
            {paidInvoices.length > 0 && (
              <div className="mt-6 p-5 rounded-2xl bg-teal-950/10 border border-teal-800/20">
                <div className="flex items-center gap-2 mb-2">
                  <ClipboardCheck size={16} className="text-teal-400" />
                  <h4 className="text-xs font-black text-teal-400 uppercase tracking-wider">
                    {paidInvoices.length} Paid Invoice{paidInvoices.length !== 1 ? 's' : ''} · ${paidInvoicesTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })} total
                  </h4>
                </div>
                <p className="text-[11px] text-slate-400 mb-3">
                  This customer&apos;s paid orders. Click one to load its products into this purchase — you then enter the Yuan buying price for each item.
                </p>
                <div className="space-y-2">
                  {paidInvoices.map((inv: any) => (
                    <button
                      key={inv._id}
                      type="button"
                      onClick={() => loadInvoiceIntoPurchase(inv)}
                      className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl border text-left transition-all ${
                        selectedInvoiceId === inv._id
                          ? 'bg-[#F15D38]/10 border-[#F15D38]/30'
                          : 'bg-[#0B0F19] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText size={14} className="text-slate-500 shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <p className="text-sm font-bold text-slate-100 truncate">
                              {(inv.items || []).map((it: any) => `${it.qty}x ${it.description}`).join(', ') || inv.invoiceNumber}
                            </p>
                            <span className="shrink-0 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border bg-emerald-950/40 text-emerald-400 border-emerald-800/30">
                              Paid
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                            {inv.invoiceNumber} • {(inv.paymentDate || inv.createdAt || '').toString().slice(0, 10)} • {(inv.items || []).length} product{(inv.items || []).length === 1 ? '' : 's'} • ${(inv.totalAmount || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <span className={`text-[9px] font-black uppercase shrink-0 ${selectedInvoiceId === inv._id ? 'text-[#F15D38]' : 'text-slate-400'}`}>
                        {selectedInvoiceId === inv._id ? 'Loaded ✓' : 'Use Order'}
                      </span>
                    </button>
                  ))}
                </div>
                {selectedInvoiceId && (
                  <button type="button" onClick={clearLoadedOrder} className="mt-3 text-[10px] font-bold text-slate-500 hover:text-slate-300 underline">
                    Clear loaded products
                  </button>
                )}
              </div>
            )}

            {/* Customer's past orders — history & one-click re-order */}
            {customerHistory.length > 0 && (
              <div className="mt-6 p-5 rounded-2xl bg-emerald-950/10 border border-emerald-800/20">
                <div className="flex items-center gap-2 mb-2">
                  <ClipboardCheck size={16} className="text-emerald-400" />
                  <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                    {customerHistory.length} Order{customerHistory.length !== 1 ? 's' : ''} Found · ${historyTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })} total
                  </h4>
                </div>
                <p className="text-[11px] text-slate-400 mb-3">
                  This customer&apos;s past purchases. Click an order to load its products into this new order, or just review the history.
                </p>
                <div className="space-y-2">
                  {customerHistory.map((o: any) => (
                    <button
                      key={o._id}
                      type="button"
                      onClick={() => loadOrderIntoPurchase(o)}
                      className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl border text-left transition-all ${
                        selectedOrderId === o._id
                          ? 'bg-[#F15D38]/10 border-[#F15D38]/30'
                          : 'bg-[#0B0F19] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText size={14} className="text-slate-500 shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <p className="text-sm font-bold text-slate-100 truncate">
                              {(o.items || []).map((it: any) => `${it.quantity}x ${it.productName}`).join(', ') || o.orderNumber}
                            </p>
                            <span className={`shrink-0 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${statusBadge(o.status).cls}`}>
                              {statusBadge(o.status).label}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-bold mt-0.5">{o.orderNumber} • {o.date} • {o.supplier} • ${(o.totalUSD || 0).toFixed(2)}</p>
                        </div>
                      </div>
                      <span className={`text-[9px] font-black uppercase shrink-0 ${selectedOrderId === o._id ? 'text-[#F15D38]' : 'text-slate-400'}`}>
                        {selectedOrderId === o._id ? 'Loaded ✓' : 'Use Order'}
                      </span>
                    </button>
                  ))}
                </div>
                {selectedOrderId && (
                  <button type="button" onClick={clearLoadedOrder} className="mt-3 text-[10px] font-bold text-slate-500 hover:text-slate-300 underline">
                    Clear loaded order
                  </button>
                )}
              </div>
            )}
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
