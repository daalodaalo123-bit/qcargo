'use client';

import { useState, useEffect, useRef } from 'react';
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
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface QuotationItem {
  description: string;
  notes: string;
  specification: string;
  qty: string;
  price: string;
  totalPrice: string;
}

function lineTotal(item: QuotationItem): number {
  return parseFloat(item.totalPrice) || 0;
}

interface ImportedItem {
  description: string;
  qty: number;
  price: number;
  notes: string;
}

export default function NewQuotation() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State variables
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [customerOptions, setCustomerOptions] = useState<{ name: string; phone: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [items, setItems] = useState<QuotationItem[]>([{ description: '', notes: '', specification: '', qty: '1', price: '', totalPrice: '' }]);
  const [estimatedPrice, setEstimatedPrice] = useState('');
  const [freightType, setFreightType] = useState('SEA');
  const [commissionRate, setCommissionRate] = useState('10');
  const [discountAmount, setDiscountAmount] = useState('0');

  // Import state
  const [importing, setImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<{ items: ImportedItem[]; customerName?: string } | null>(null);
  const [importError, setImportError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const subtotal = parseFloat(estimatedPrice) || 0;
  const commissionAmount = parseFloat(commissionRate) > 0
    ? subtotal * (parseFloat(commissionRate) / 100)
    : 0;
  const discountAmt = Math.max(0, parseFloat(discountAmount) || 0);
  const grandTotal = Math.max(0, subtotal + commissionAmount - discountAmt);

  // Type-ahead matches for the customer name field
  const nameQuery = customerName.trim().toLowerCase();
  const customerSuggestions = nameQuery.length >= 1
    ? customerOptions
        .filter((o) => o.name.toLowerCase().includes(nameQuery) && o.name.toLowerCase() !== nameQuery)
        .sort((a, b) => {
          const aStarts = a.name.toLowerCase().startsWith(nameQuery) ? 0 : 1;
          const bStarts = b.name.toLowerCase().startsWith(nameQuery) ? 0 : 1;
          return aStarts - bStarts || a.name.localeCompare(b.name);
        })
        .slice(0, 8)
    : [];

  // Load existing customers (from CRM + past quotations) for the name dropdown
  useEffect(() => {
    const loadCustomers = async () => {
      const map = new Map<string, { name: string; phone: string }>();
      const add = (name?: string, phone?: string) => {
        const clean = (name || '').trim();
        if (!clean) return;
        const key = clean.toLowerCase();
        const existing = map.get(key);
        if (!existing) map.set(key, { name: clean, phone: (phone || '').trim() });
        else if (!existing.phone && phone) existing.phone = phone.trim();
      };
      try {
        const [cRes, qRes] = await Promise.all([
          fetch('/api/customers'),
          fetch('/api/quotations'),
        ]);
        if (cRes.ok) {
          const customers = await cRes.json();
          (Array.isArray(customers) ? customers : []).forEach((c: { name?: string; phone?: string }) => add(c.name, c.phone));
        }
        if (qRes.ok) {
          const quotes = await qRes.json();
          (Array.isArray(quotes) ? quotes : []).forEach((q: { customer?: string; phone?: string }) => add(q.customer, q.phone));
        }
        setCustomerOptions(Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name)));
      } catch (e) {
        console.error('Failed to load customers for dropdown', e);
      }
    };
    loadCustomers();
  }, []);

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
      customer: customerName, phone, goods: goodsText, price: grandTotal,
      date: new Date().toISOString().split('T')[0], status,
      type: freightType.toUpperCase() as 'AIR' | 'SEA',
      commissionRate: parseFloat(commissionRate) || 0,
      commissionAmount,
      discountAmount: discountAmt,
      discountRate: 0,
      items: items.filter(it => it.description.trim()).map(it => ({
        description: it.description.trim(),
        notes: it.notes.trim(),
        specification: it.specification.trim(),
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

  const addItem = () => setItems([...items, { description: '', notes: '', specification: '', qty: '1', price: '', totalPrice: '' }]);

  const updateItem = (index: number, field: keyof QuotationItem, value: string) => {
    const newItems = items.map((item, i) => {
      if (i !== index) return item;
      const updated = { ...item, [field]: value };
      const total = parseFloat(updated.totalPrice) || 0;
      const qty = parseFloat(updated.qty) || 1;
      updated.price = total > 0 ? (total / qty).toFixed(2) : '';
      return updated;
    });
    setItems(newItems);
  };

  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  const handleFileImport = async (file: File) => {
    setImporting(true);
    setImportError('');
    setImportPreview(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/quotations/parse-items', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to parse file');
      if (!data.items || data.items.length === 0) throw new Error('No items found in the file. Check that it has description, quantity, and price columns.');
      setImportPreview(data);
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : 'Failed to import file');
    } finally {
      setImporting(false);
    }
  };

  const applyImport = () => {
    if (!importPreview) return;
    const newItems: QuotationItem[] = importPreview.items.map((it) => ({
      description: it.description,
      notes: it.notes || '',
      specification: '',
      qty: String(it.qty),
      price: String(it.price),
      totalPrice: (it.qty * it.price).toFixed(2),
    }));
    setItems(newItems.length > 0 ? newItems : [{ description: '', notes: '', specification: '', qty: '1', price: '', totalPrice: '' }]);
    if (importPreview.customerName && !customerName.trim()) {
      setCustomerName(importPreview.customerName);
    }
    setImportPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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
              <div className="relative">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Customer Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="text"
                    className="search-input !pl-10"
                    placeholder="Type or pick a customer..."
                    value={customerName}
                    autoComplete="off"
                    onChange={e => { setCustomerName(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  />
                </div>
                {showSuggestions && customerSuggestions.length > 0 && (
                  <div className="absolute z-30 left-0 right-0 mt-1 bg-[#131B2E] border border-slate-700 rounded-xl shadow-2xl shadow-black/40 max-h-60 overflow-y-auto custom-scrollbar">
                    {customerSuggestions.map((o, i) => (
                      <button
                        key={i}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setCustomerName(o.name);
                          if (o.phone) setPhone(o.phone);
                          setShowSuggestions(false);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-[#F15D38]/10 flex items-center justify-between gap-3 border-b border-slate-800/50 last:border-0 transition-colors"
                      >
                        <span className="text-sm font-bold text-slate-200 flex items-center gap-2">
                          <User size={13} className="text-slate-500" />
                          {o.name}
                        </span>
                        {o.phone && <span className="text-[11px] text-slate-500 font-mono shrink-0">{o.phone}</span>}
                      </button>
                    ))}
                  </div>
                )}
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
              <span className="sm:col-span-5 text-[10px] font-bold text-slate-500 uppercase">Good Name</span>
              <span className="sm:col-span-2 text-[10px] font-bold text-slate-500 uppercase">Qty</span>
              <span className="sm:col-span-2 text-[10px] font-bold text-slate-500 uppercase">Unit Price</span>
              <span className="sm:col-span-2 text-[10px] font-bold text-slate-500 uppercase">Total (USD)</span>
              <span className="sm:col-span-1" />
            </div>
            {items.map((item, idx) => (
              <div key={idx} className="mb-4 p-4 bg-[#0B0F19] rounded-xl border border-slate-800/80 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Good Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Solar panels"
                      className="search-input !py-2.5 min-w-0"
                      value={item.description}
                      onChange={e => updateItem(idx, 'description', e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Qty</label>
                    <input
                      type="number"
                      min={1}
                      placeholder="1"
                      className="search-input !py-2.5 min-w-0"
                      value={item.qty}
                      onChange={e => updateItem(idx, 'qty', e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Unit Price</label>
                    <input
                      type="number"
                      readOnly
                      placeholder="0.00"
                      className="search-input !py-2.5 min-w-0 opacity-50 cursor-not-allowed bg-slate-900/50"
                      value={item.price}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Total (USD)</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0.00"
                      className="search-input !py-2.5 min-w-0"
                      value={item.totalPrice}
                      onChange={e => updateItem(idx, 'totalPrice', e.target.value)}
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
                <input
                  type="text"
                  placeholder="Short description / notes for this item (optional)"
                  className="search-input !py-2 w-full text-sm text-slate-400 placeholder:text-slate-600"
                  value={item.notes}
                  onChange={e => updateItem(idx, 'notes', e.target.value)}
                />
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 mt-1">
                    Full Product Specification (optional)
                  </label>
                  <textarea
                    rows={5}
                    placeholder={'Paste full product specs here (engine, dimensions, warranty, spare parts, FOB price...).\nUse ## Heading, * bullet, and | a | b | tables — they print formatted on extra pages.'}
                    className="search-input !py-2 w-full text-sm leading-relaxed font-mono placeholder:text-slate-600 resize-y"
                    value={item.specification}
                    onChange={e => updateItem(idx, 'specification', e.target.value)}
                  />
                  <p className="text-[10px] text-slate-600 mt-1">
                    Leave empty for simple items. When filled, a professional spec sheet is added to the PDF after the price page.
                  </p>
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

          {/* Import Items from File */}
          <div className="shipment-card border border-slate-800 bg-[#131B2E]">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-800/40">
              <Upload size={18} className="text-[#F15D38]" />
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Import Items from File</h3>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files[0];
                if (file) handleFileImport(file);
              }}
              onClick={() => !importing && fileInputRef.current?.click()}
              className={`p-8 border-2 border-dashed rounded-2xl text-center transition-all cursor-pointer
                ${dragOver ? 'border-[#F15D38] bg-[#F15D38]/10' : 'border-slate-700 bg-slate-950/30 hover:border-[#F15D38]/50 hover:bg-[#F15D38]/5'}
                ${importing ? 'pointer-events-none opacity-70' : ''}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".csv,.tsv,.xlsx,.xls,.pdf,.png,.jpg,.jpeg,.webp,.gif"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileImport(f); }}
              />
              {importing ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 size={28} className="text-[#F15D38] animate-spin" />
                  <p className="text-sm font-bold text-slate-300">Reading your file...</p>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 bg-[#131B2E] rounded-xl border border-slate-700 flex items-center justify-center mx-auto mb-4">
                    <Upload size={20} className="text-[#F15D38]" />
                  </div>
                  <p className="text-sm font-bold text-slate-300">Drop your list here or click to browse</p>
                  <p className="text-xs text-slate-500 mt-2">Supports Excel, CSV, PDF, and images of paper lists</p>
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {['Excel', 'CSV', 'PDF', 'PNG/JPG'].map((t) => (
                      <span key={t} className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] font-bold rounded-md uppercase tracking-wider">{t}</span>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Error */}
            {importError && (
              <div className="mt-4 p-4 bg-rose-950/30 border border-rose-800/50 rounded-xl flex items-start gap-3">
                <AlertCircle size={16} className="text-rose-400 mt-0.5 shrink-0" />
                <p className="text-xs text-rose-300">{importError}</p>
              </div>
            )}

            {/* Preview */}
            {importPreview && (
              <div className="mt-4 border border-emerald-800/40 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-emerald-950/40 border-b border-emerald-800/30">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-400" />
                    <span className="text-xs font-black text-emerald-300 uppercase tracking-wider">
                      {importPreview.items.length} item{importPreview.items.length !== 1 ? 's' : ''} found
                      {importPreview.customerName ? ` · ${importPreview.customerName}` : ''}
                    </span>
                  </div>
                  <button onClick={() => { setImportPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="text-slate-500 hover:text-slate-300">
                    <X size={14} />
                  </button>
                </div>
                <div className="max-h-56 overflow-y-auto divide-y divide-slate-800/50">
                  {importPreview.items.map((it, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-2.5 text-xs">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-200 truncate">{it.description}</p>
                        {it.notes && <p className="text-slate-500 truncate">{it.notes}</p>}
                      </div>
                      <div className="flex items-center gap-4 ml-4 shrink-0 text-slate-400">
                        <span>×{it.qty}</span>
                        <span className="font-bold text-slate-200">${it.price.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-3 bg-slate-900/60 flex gap-3">
                  <button
                    onClick={() => { setImportPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="flex-1 py-2 text-slate-400 text-xs font-bold uppercase border border-slate-700 rounded-lg hover:bg-slate-800"
                  >
                    Discard
                  </button>
                  <button
                    onClick={applyImport}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase rounded-lg"
                  >
                    Apply to Quotation
                  </button>
                </div>
              </div>
            )}
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

              {/* Commission & Discount */}
              <div className="p-4 rounded-xl bg-[#0B0F19] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-400 uppercase">Commission</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step="0.5"
                      className="w-16 bg-slate-900 border border-slate-700 rounded-lg py-1 px-2 text-slate-100 font-black text-sm text-center focus:outline-none focus:ring-1 focus:ring-[#F15D38]/50"
                      value={commissionRate}
                      onChange={e => setCommissionRate(e.target.value)}
                    />
                    <span className="text-slate-400 font-bold text-sm">%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-400 uppercase">Discount ($)</label>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400 font-bold text-sm">-$</span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0.00"
                      className="w-20 bg-slate-900 border border-slate-700 rounded-lg py-1 px-2 text-emerald-400 font-black text-sm text-center focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                      value={discountAmount}
                      onChange={e => setDiscountAmount(e.target.value)}
                    />
                  </div>
                </div>
                <div className="border-t border-slate-800/60 pt-2 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-bold text-slate-300">${subtotal.toFixed(2)}</span>
                  </div>
                  {commissionAmount > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Commission ({commissionRate}%)</span>
                      <span className="font-bold text-[#F15D38]">+${commissionAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {discountAmt > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Discount</span>
                      <span className="font-bold text-emerald-400">-${discountAmt.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-slate-800 pt-2">
                    <span className="text-xs font-black text-slate-300 uppercase tracking-wider">Total</span>
                    <span className="font-black text-slate-100 text-base">${grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/40 space-y-3">
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
