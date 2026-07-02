'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Plus, Trash2, Save, ArrowLeft, DollarSign, Package,
  Hash, User, Plane, Ship, CheckCircle2, AlertCircle, Phone, Search, X, FileText, ClipboardCheck
} from 'lucide-react';
import { useRouter } from 'next/navigation';

/* ─────────────────────────────────────────────
   Reusable Searchable Combobox Component
───────────────────────────────────────────── */
interface ComboOption {
  value: string;
  label: string;
  sublabel?: string;
  meta?: string;
}

function SearchCombobox({
  options,
  value,
  onChange,
  placeholder,
  icon: Icon,
  allowFreeText = false,
  onFreeTextChange,
}: {
  options: ComboOption[];
  value: string;
  onChange: (val: string, option?: ComboOption) => void;
  placeholder: string;
  icon: any;
  allowFreeText?: boolean;
  onFreeTextChange?: (text: string) => void;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Sync external value changes
  useEffect(() => { setQuery(value); }, [value]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setFocused(false);
        // If free text, commit the typed text
        if (allowFreeText && query !== value) {
          onChange(query);
          if (onFreeTextChange) onFreeTextChange(query);
        }
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [query, value, allowFreeText, onChange, onFreeTextChange]);

  const filtered = options.filter(opt =>
    opt.label.toLowerCase().includes(query.toLowerCase()) ||
    (opt.sublabel || '').toLowerCase().includes(query.toLowerCase()) ||
    (opt.meta || '').toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (opt: ComboOption) => {
    setQuery(opt.label);
    onChange(opt.value, opt);
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setOpen(true);
    if (allowFreeText) {
      onChange(e.target.value);
      if (onFreeTextChange) onFreeTextChange(e.target.value);
    }
  };

  const handleClear = () => {
    setQuery('');
    onChange('');
    if (onFreeTextChange) onFreeTextChange('');
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      {/* Input */}
      <div className={`relative flex items-center search-input !p-0 overflow-hidden transition-all ${focused ? 'border-[#F15D38] shadow-[0_0_0_3px_rgba(241,93,56,0.2)]' : ''}`}>
        <Icon size={16} className="absolute left-3 text-slate-500 pointer-events-none z-10" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => { setFocused(true); setOpen(true); }}
          placeholder={placeholder}
          className="w-full bg-transparent pl-10 pr-10 py-2.5 text-sm font-medium text-slate-100 outline-none placeholder:text-slate-500"
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-[calc(100%+6px)] left-0 right-0 bg-[#131B2E] border border-slate-700 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
          {/* Search bar inside dropdown */}
          <div className="p-3 border-b border-slate-800">
            <div className="flex items-center gap-2 px-3 py-2 bg-[#0B0F19] rounded-xl border border-slate-800">
              <Search size={13} className="text-slate-500 shrink-0" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {filtered.length} Result{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {allowFreeText ? `Create "${query}" as new entry` : 'No matches found'}
                </p>
              </div>
            ) : (
              filtered.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className={`w-full px-4 py-3.5 flex items-start justify-between gap-3 hover:bg-[#F15D38]/10 transition-all text-left group border-b border-slate-800/40 last:border-0 ${opt.value === value ? 'bg-[#F15D38]/5 border-l-2 border-l-[#F15D38]' : ''}`}
                >
                  <div>
                    <p className={`text-sm font-bold ${opt.value === value ? 'text-[#F15D38]' : 'text-slate-100 group-hover:text-slate-50'}`}>
                      {opt.label}
                    </p>
                    {opt.sublabel && (
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">{opt.sublabel}</p>
                    )}
                  </div>
                  {opt.meta && (
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 shrink-0 mt-0.5">
                      {opt.meta}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>

          {allowFreeText && query && !filtered.find(o => o.label.toLowerCase() === query.toLowerCase()) && (
            <div className="border-t border-slate-800 p-3">
              <button
                type="button"
                onClick={() => { onChange(query); if (onFreeTextChange) onFreeTextChange(query); setOpen(false); }}
                className="w-full py-2.5 px-3 flex items-center gap-2 bg-[#F15D38]/5 hover:bg-[#F15D38]/15 border border-[#F15D38]/20 rounded-xl transition-all text-left"
              >
                <Plus size={13} className="text-[#F15D38] shrink-0" />
                <span className="text-xs font-bold text-[#F15D38]">Use "{query}" as new customer</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface CargoLine {
  description: string;
  trackingNumber: string;
  qty: number;
  weight: number;
  cbm: number;
}

const emptyCargoLine = (): CargoLine => ({
  description: '',
  trackingNumber: '',
  qty: 1,
  weight: 0,
  cbm: 0,
});

// One priced product line — a product name + its measure (KG/CBM) + rate,
// plus customs/tax for AIR. Each product carries its own rate. `amount` is the
// line's freight subtotal (units × rate) and is the source of truth for the
// total: you can type the rate (amount fills in) OR type the amount (rate is
// worked out), and lines with no weight/CBM can carry a flat amount.
interface PriceLine {
  product: string;
  weight: number;
  cbm: number;
  rate: number;
  amount: number;
  customs: number;
  tax: number;
}

const emptyPriceLine = (): PriceLine => ({
  product: '',
  weight: 0,
  cbm: 0,
  rate: 0,
  amount: 0,
  customs: 0,
  tax: 0,
});

const round2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;

/* ─────────────────────────────────────────────
   Main New Shipment Page
───────────────────────────────────────────── */
export default function NewShipmentPage() {
  const router = useRouter();
  const [shipmentType, setShipmentType] = useState<'AIR' | 'SEA'>('AIR');
  const [batches, setBatches] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [selectedQuotationId, setSelectedQuotationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [cargoLines, setCargoLines] = useState<CargoLine[]>([emptyCargoLine()]);
  const [priceLines, setPriceLines] = useState<PriceLine[]>([emptyPriceLine()]);
  const [products, setProducts] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    customerName: '', phone: '', batchId: 'UNASSIGNED',
    discount: 0, paymentMethod: 'ZAAD', paidAmount: 0, notes: ''
  });

  // Fetch batches and customers in parallel on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [batchRes, customerRes, quoteRes, productRes] = await Promise.all([
          fetch('/api/batches'),
          fetch('/api/customers'),
          fetch('/api/quotations'),
          fetch('/api/products'),
        ]);
        const batchData = batchRes.ok ? await batchRes.json() : [];
        const customerData = customerRes.ok ? await customerRes.json() : [];
        const quoteData = quoteRes.ok ? await quoteRes.json() : [];
        const productData = productRes.ok ? await productRes.json() : [];
        setBatches(batchData);
        setCustomers(customerData);
        setQuotations(quoteData);
        setProducts(Array.isArray(productData) ? productData : []);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Computed values — one row per priced product, each with its own rate.
  const isAir = shipmentType === 'AIR';
  // Freight for a line is its stored amount; fall back to units × rate for any
  // older line that predates the amount field.
  const lineFreight = (l: PriceLine) =>
    l.amount != null && l.amount !== 0
      ? Number(l.amount) || 0
      : (isAir ? Number(l.weight) || 0 : Number(l.cbm) || 0) * (Number(l.rate) || 0);
  const freightTotal = priceLines.reduce((s, l) => s + lineFreight(l), 0);
  const customsTotal = isAir ? priceLines.reduce((s, l) => s + (Number(l.customs) || 0), 0) : 0;
  const taxTotal = isAir ? priceLines.reduce((s, l) => s + (Number(l.tax) || 0), 0) : 0;
  const totalUnits = priceLines.reduce((s, l) => s + (isAir ? Number(l.weight) || 0 : Number(l.cbm) || 0), 0);
  const grandTotal = freightTotal + customsTotal + taxTotal - (Number(formData.discount) || 0);
  const balance = grandTotal - formData.paidAmount;

  const addPriceLine = () => setPriceLines([...priceLines, emptyPriceLine()]);
  const removePriceLine = (i: number) =>
    setPriceLines(priceLines.length > 1 ? priceLines.filter((_, idx) => idx !== i) : [emptyPriceLine()]);
  // Update a price line, keeping rate ⇄ amount in sync:
  //  • edit Rate   → amount = units × rate
  //  • edit Weight/CBM → amount = units × rate (rate kept)
  //  • edit Amount → rate = amount ÷ units (rate cleared when there are no units)
  const updatePriceLine = (i: number, field: keyof PriceLine, value: string | number) => {
    const next = [...priceLines];
    const line: PriceLine = { ...next[i], [field]: value } as PriceLine;
    const units = Number(isAir ? line.weight : line.cbm) || 0;
    if (field === 'rate') {
      line.amount = round2(units * (Number(line.rate) || 0));
    } else if (field === 'weight' || field === 'cbm') {
      const rate = Number(line.rate) || 0;
      const amt = Number(line.amount) || 0;
      // Rate known → total follows. Only a total set → derive the rate but keep
      // the total (so adding units later never wipes a typed total).
      if (rate > 0) line.amount = round2(units * rate);
      else if (units > 0 && amt > 0) line.rate = round2(amt / units);
      else line.amount = round2(units * rate);
    } else if (field === 'amount') {
      const amt = Number(value) || 0;
      line.amount = amt;
      line.rate = units > 0 ? round2(amt / units) : 0;
    }
    next[i] = line;
    setPriceLines(next);
  };

  // Build combobox options
  const customerOptions: ComboOption[] = customers.map((c: any) => ({
    value: c._id || c.id,
    label: c.name,
    sublabel: c.phone,
    meta: c.city || 'Hargeisa',
    // Store phone as extra
    ...c
  }));

  const batchOptions: ComboOption[] = [
    { value: 'UNASSIGNED', label: 'UNASSIGNED', sublabel: 'No batch assigned', meta: '—' },
    ...batches.map((b: any) => ({
      value: b.batchId,
      label: b.batchId,
      sublabel: `${b.origin?.split(',')[0] || ''} → ${b.destination?.split(',')[0] || ''}`,
      meta: `${b.type} • ${b.shipments || 0} pkgs`,
    }))
  ];

  const handleCustomerSelect = (val: string, opt?: ComboOption) => {
    // val is customer name when free-text, or ObjectId when selected from list
    const matchedCustomer = customers.find((c: any) => (c._id || c.id) === val || c.name === val);
    if (matchedCustomer) {
      setFormData(prev => ({
        ...prev,
        customerName: matchedCustomer.name,
        phone: matchedCustomer.phone || prev.phone,
      }));
    } else {
      setFormData(prev => ({ ...prev, customerName: val }));
    }
  };

  // Find this customer's paid, approved quotations whose goods can be loaded into the shipment
  const lastDigits = (phone: string) => (phone || '').replace(/\D/g, '').slice(-9);

  useEffect(() => {
    const digits = lastDigits(formData.phone);
    if (!digits) {
      setCustomerOrders([]);
      return;
    }
    const matches = quotations.filter((q: any) =>
      q.status === 'APPROVED' &&
      q.paymentStatus !== 'UNPAID' &&
      lastDigits(q.phone || '') === digits
    );
    setCustomerOrders(matches);
    if (!matches.find((q: any) => q._id === selectedQuotationId)) {
      setSelectedQuotationId(null);
    }
  }, [formData.phone, quotations]);

  const loadOrderIntoShipment = (quote: any) => {
    const lines: CargoLine[] = quote.items && quote.items.length > 0
      ? quote.items.map((it: any) => ({
          description: it.description || '',
          trackingNumber: '',
          qty: it.qty || 1,
          weight: 0,
          cbm: 0,
        }))
      : [emptyCargoLine()];
    setCargoLines(lines);
    setSelectedQuotationId(quote._id);
  };

  const clearLinkedOrder = () => {
    setSelectedQuotationId(null);
    setCargoLines([emptyCargoLine()]);
  };

  const addCargoLine = () => setCargoLines([...cargoLines, emptyCargoLine()]);
  const removeCargoLine = (i: number) =>
    setCargoLines(cargoLines.length > 1 ? cargoLines.filter((_, idx) => idx !== i) : [emptyCargoLine()]);

  const updateCargoLine = (index: number, field: keyof CargoLine, value: string | number) => {
    const next = [...cargoLines];
    next[index] = { ...next[index], [field]: value };
    setCargoLines(next);
  };

  const handleSave = async () => {
    if (!formData.customerName.trim()) { alert('Please enter or select a customer name'); return; }
    if (!formData.phone.trim()) { alert('Please enter a phone number'); return; }

    const initials = formData.customerName.split(' ').map(n => n[0] || '').join('').toUpperCase();
    const shipNum = `${shipmentType}-2026-${initials}-${String(Date.now()).substring(7)}`;

    const payload = {
      shipmentNumber: shipNum,
      customer: formData.customerName,
      phone: formData.phone,
      type: shipmentType,
      status: 'PENDING',
      payment: formData.paidAmount >= grandTotal ? 'PAID' : 'UNPAID',
      total: grandTotal,
      batch: formData.batchId,
      date: new Date().toISOString().split('T')[0],
      weight: priceLines.reduce((s, l) => s + (Number(l.weight) || 0), 0),
      cbm: priceLines.reduce((s, l) => s + (Number(l.cbm) || 0), 0),
      rate: priceLines[0]?.rate || 0,
      customs: customsTotal,
      tax: taxTotal,
      discount: formData.discount,
      priceLines: priceLines
        .filter((l) => l.product.trim())
        .map((l) => ({
          product: l.product.trim(),
          weight: Number(l.weight) || 0,
          cbm: Number(l.cbm) || 0,
          rate: Number(l.rate) || 0,
          amount: lineFreight(l),
          customs: Number(l.customs) || 0,
          tax: Number(l.tax) || 0,
        })),
      paymentMethod: formData.paymentMethod,
      paidAmount: formData.paidAmount,
      notes: formData.notes,
      items: cargoLines
        .filter((line) => line.description.trim())
        .map((line) => ({
          description: line.description.trim(),
          qty: line.qty || 1,
          weight: line.weight || 0,
          cbm: line.cbm || 0,
          value: 0,
        })),
      courierPackages: cargoLines
        .filter(line => line.trackingNumber.trim())
        .map(line => ({
          trackingNumber: line.trackingNumber.trim(),
          goods: line.description.trim(),
          qty: line.qty || 1,
          courier: '',
        })),
    };

    try {
      const res = await fetch('/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create shipment');
      }
      alert(`✅ Shipment ${shipNum} created successfully!`);
      router.push('/admin/shipments');
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
          <h1 className="text-3xl font-black text-slate-100 tracking-tight">New Shipment Entry</h1>
          <p className="text-slate-400 font-medium">Record a new customer shipment and calculate freight</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">

          {/* ── Customer & Logistics ── */}
          <div className="shipment-card">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-800/40">
              <User size={18} className="text-[#F15D38]" />
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Customer & Logistics</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Searchable Customer Picker */}
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Customer Name</label>
                <SearchCombobox
                  options={customerOptions}
                  value={formData.customerName}
                  onChange={handleCustomerSelect}
                  placeholder={loading ? 'Loading customers…' : 'Search or type name'}
                  icon={User}
                  allowFreeText={true}
                  onFreeTextChange={(text) => setFormData(prev => ({ ...prev, customerName: text }))}
                />
                {customers.length > 0 && (
                  <p className="text-[10px] text-slate-500 mt-1.5 font-medium">
                    {customers.length} existing customer{customers.length !== 1 ? 's' : ''} · select to auto-fill phone
                  </p>
                )}
              </div>

              {/* Phone / WhatsApp */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Phone / WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="text"
                    className={`search-input !pl-10 transition-all ${formData.phone ? 'border-emerald-700/40 shadow-[0_0_0_1px_rgba(16,185,129,0.15)]' : ''}`}
                    placeholder="+252 ..."
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                {formData.phone && (
                  <p className="text-[10px] text-emerald-500 mt-1.5 font-bold">✓ WhatsApp number set</p>
                )}
              </div>

              {/* Searchable Batch Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Assigned Batch</label>
                <SearchCombobox
                  options={batchOptions}
                  value={formData.batchId}
                  onChange={(val) => {
                    setFormData(prev => ({ ...prev, batchId: val }));
                    if (val !== 'UNASSIGNED') {
                      const batch = batches.find((b: any) => b.batchId === val);
                      if (batch?.type === 'AIR' || batch?.type === 'SEA') {
                        setShipmentType(batch.type);
                      }
                    }
                  }}
                  placeholder={loading ? 'Loading batches…' : 'Search or select batch'}
                  icon={Hash}
                />
                {formData.batchId !== 'UNASSIGNED' && (
                  <p className="text-[10px] text-[#F15D38] mt-1.5 font-bold">✓ Assigned to {formData.batchId}</p>
                )}
              </div>
            </div>

            {/* Customer's paid orders ready to ship */}
            {customerOrders.length > 0 && (
              <div className="mb-8 p-5 rounded-2xl bg-emerald-950/10 border border-emerald-800/20">
                <div className="flex items-center gap-2 mb-2">
                  <ClipboardCheck size={16} className="text-emerald-400" />
                  <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                    {customerOrders.length} Paid Order{customerOrders.length !== 1 ? 's' : ''} Found
                  </h4>
                </div>
                <p className="text-[11px] text-slate-400 mb-3">
                  Select an order to auto-fill the cargo list below with the goods this customer already paid for. You'll just need to enter the {shipmentType === 'AIR' ? 'weight (kg)' : 'volume (cbm)'} for each item.
                </p>
                <div className="space-y-2">
                  {customerOrders.map((q: any) => (
                    <button
                      key={q._id}
                      type="button"
                      onClick={() => loadOrderIntoShipment(q)}
                      className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl border text-left transition-all ${
                        selectedQuotationId === q._id
                          ? 'bg-[#F15D38]/10 border-[#F15D38]/30'
                          : 'bg-[#0B0F19] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText size={14} className="text-slate-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-100 truncate">{q.goods}</p>
                          <p className="text-[10px] text-slate-500 font-bold mt-0.5">{q.date} • {q.type} FREIGHT • ${(q.price || 0).toFixed(2)}</p>
                        </div>
                      </div>
                      <span className={`text-[9px] font-black uppercase shrink-0 ${selectedQuotationId === q._id ? 'text-[#F15D38]' : 'text-slate-400'}`}>
                        {selectedQuotationId === q._id ? 'Loaded ✓' : 'Use Order'}
                      </span>
                    </button>
                  ))}
                </div>
                {selectedQuotationId && (
                  <button type="button" onClick={clearLinkedOrder} className="mt-3 text-[10px] font-bold text-slate-500 hover:text-slate-300 underline">
                    Clear loaded order
                  </button>
                )}
              </div>
            )}

            {/* Type Toggle */}
            <div className="flex p-1 bg-[#0B0F19] rounded-2xl mb-8 border border-slate-800">
              <button onClick={() => setShipmentType('AIR')}
                className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-bold rounded-xl transition-all ${
                  shipmentType === 'AIR' ? 'bg-[#F15D38] text-white shadow-lg shadow-[#F15D38]/20' : 'text-slate-400 hover:text-slate-200'
                }`}>
                <Plane size={18} /> Air Cargo
              </button>
              <button onClick={() => setShipmentType('SEA')}
                className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-bold rounded-xl transition-all ${
                  shipmentType === 'SEA' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40' : 'text-slate-400 hover:text-slate-200'
                }`}>
                <Ship size={18} /> Sea Cargo
              </button>
            </div>

            {/* Per-product pricing — each product has its own rate. Sea hides Customs & Tax. */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Pricing · {isAir ? 'Weight × Rate' : 'CBM × Rate'} per product
                </label>
                <button
                  type="button"
                  onClick={addPriceLine}
                  className="btn bg-[#F15D38]/10 text-[#F15D38] border border-[#F15D38]/20 hover:bg-[#F15D38]/20 py-1.5 px-3 text-xs font-bold flex items-center gap-2"
                >
                  <Plus size={14} /> Add Product
                </button>
              </div>

              <div className="space-y-3">
                {priceLines.map((line, index) => {
                  return (
                    <div
                      key={index}
                      className="grid grid-cols-2 md:grid-cols-12 gap-3 p-4 bg-[#0B0F19] rounded-2xl border border-slate-800 relative group"
                    >
                      <button
                        type="button"
                        onClick={() => removePriceLine(index)}
                        className="absolute -right-2 -top-2 p-1.5 bg-[#131B2E] border border-slate-700 text-rose-500 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Remove product"
                      >
                        <Trash2 size={14} />
                      </button>

                      <div className="col-span-2 md:col-span-4">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Product Name</label>
                        <input
                          type="text"
                          list="product-suggestions"
                          className="search-input !py-2 !px-3 min-w-0"
                          placeholder="e.g. Bags"
                          value={line.product}
                          onChange={(e) => updatePriceLine(index, 'product', e.target.value)}
                        />
                      </div>

                      <div className={isAir ? 'md:col-span-2' : 'md:col-span-3'}>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{isAir ? 'Weight (KG)' : 'CBM'}</label>
                        <input
                          type="number" min={0} step="any"
                          className="search-input !py-2 !px-3 min-w-0 font-bold text-[#F15D38]"
                          value={isAir ? line.weight : line.cbm}
                          onChange={(e) => updatePriceLine(index, isAir ? 'weight' : 'cbm', Number(e.target.value))}
                        />
                      </div>

                      <div className={isAir ? 'md:col-span-2' : 'md:col-span-3'}>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Rate ($)</label>
                        <input
                          type="number" min={0} step="any"
                          className="search-input !py-2 !px-3 min-w-0 font-bold text-[#F15D38]"
                          value={line.rate}
                          onChange={(e) => updatePriceLine(index, 'rate', Number(e.target.value))}
                        />
                      </div>

                      {isAir && (
                        <>
                          <div className="md:col-span-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Customs</label>
                            <input
                              type="number" min={0} step="any"
                              className="search-input !py-2 !px-3 min-w-0"
                              value={line.customs}
                              onChange={(e) => updatePriceLine(index, 'customs', Number(e.target.value))}
                            />
                          </div>
                          <div className="md:col-span-1">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tax</label>
                            <input
                              type="number" min={0} step="any"
                              className="search-input !py-2 !px-3 min-w-0"
                              value={line.tax}
                              onChange={(e) => updatePriceLine(index, 'tax', Number(e.target.value))}
                            />
                          </div>
                        </>
                      )}

                      <div className={`flex flex-col justify-end ${isAir ? 'md:col-span-1' : 'md:col-span-2'}`}>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 text-right">Total ($)</label>
                        <input
                          type="number" min={0} step="any"
                          className="search-input !py-2 !px-3 min-w-0 font-black text-emerald-400 text-right"
                          value={line.amount}
                          onChange={(e) => updatePriceLine(index, 'amount', Number(e.target.value))}
                          title="Type the total to set it directly — the rate is worked out for you"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <datalist id="product-suggestions">
                {products.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
              <p className="text-[10px] text-slate-500 mt-3 font-medium">
                One row per product. Type the <span className="font-bold text-slate-300">Rate</span> and the Total fills in — or type the <span className="font-bold text-slate-300">Total</span> and the rate is worked out. You can also leave {isAir ? 'weight' : 'CBM'} blank and just enter a Total. Total {isAir ? 'weight' : 'volume'}: <span className="font-bold text-slate-300">{totalUnits.toLocaleString()} {isAir ? 'KG' : 'CBM'}</span>.
              </p>
            </div>
          </div>

          {/* ── Cargo (itemized) ── */}
          <div className="shipment-card">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-800/40">
              <div className="flex items-center gap-2">
                <Package size={18} className="text-[#F15D38]" />
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Cargo</h3>
              </div>
              <button
                type="button"
                onClick={addCargoLine}
                className="btn bg-[#F15D38]/10 text-[#F15D38] border border-[#F15D38]/20 hover:bg-[#F15D38]/20 py-2 px-4 text-xs font-bold flex items-center gap-2"
              >
                <Plus size={14} /> Add Row
              </button>
            </div>

            <div className="hidden md:grid md:grid-cols-12 gap-3 mb-2 px-1">
              <span className="md:col-span-5 text-[10px] font-bold text-slate-500 uppercase">Goods</span>
              <span className="md:col-span-3 text-[10px] font-bold text-slate-500 uppercase">Tracking #</span>
              <span className="md:col-span-1 text-[10px] font-bold text-slate-500 uppercase">Qty</span>
              <span className="md:col-span-2 text-[10px] font-bold text-slate-500 uppercase">{shipmentType === 'AIR' ? 'Weight (KG)' : 'CBM'}</span>
              <span className="md:col-span-1" />
            </div>

            <div className="space-y-3">
              {cargoLines.map((line, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-[#0B0F19] rounded-2xl border border-slate-800 relative group"
                >
                  <button
                    type="button"
                    onClick={() => removeCargoLine(index)}
                    className="absolute -right-2 -top-2 p-1.5 bg-[#131B2E] border border-slate-700 text-rose-500 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove row"
                  >
                    <Trash2 size={14} />
                  </button>
                  <div className="md:col-span-5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 md:sr-only">Goods</label>
                    <input
                      type="text"
                      className="search-input !py-2 !px-3 min-w-0"
                      placeholder="e.g. Shoes, bags"
                      value={line.description}
                      onChange={(e) => updateCargoLine(index, 'description', e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 md:sr-only">Tracking #</label>
                    <input
                      type="text"
                      className="search-input !py-2 !px-3 min-w-0 font-mono"
                      placeholder="e.g. 1Z999AA10123456784"
                      value={line.trackingNumber}
                      onChange={(e) => updateCargoLine(index, 'trackingNumber', e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 md:sr-only">Qty</label>
                    <input
                      type="number"
                      min={1}
                      className="search-input !py-2 !px-3 min-w-0"
                      value={line.qty}
                      onChange={(e) => updateCargoLine(index, 'qty', Number(e.target.value))}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 md:sr-only">{shipmentType === 'AIR' ? 'Weight (KG)' : 'CBM'}</label>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      className="search-input !py-2 !px-3 min-w-0"
                      placeholder={shipmentType === 'AIR' ? 'KG' : 'CBM'}
                      value={shipmentType === 'AIR' ? line.weight : line.cbm}
                      onChange={(e) => updateCargoLine(index, shipmentType === 'AIR' ? 'weight' : 'cbm', Number(e.target.value))}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-3 font-medium">
              One row per package — totals for {shipmentType === 'AIR' ? 'weight' : 'volume'} update automatically above.
            </p>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-6">
          {/* Freight Summary */}
          <div className="bg-[#131B2E] border border-slate-800 p-8 rounded-[2.5rem] shadow-xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Freight Summary</h3>
            <div className="space-y-5 mb-10">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Freight Charges</span>
                <span className="font-bold text-lg text-slate-100">${freightTotal.toFixed(2)}</span>
              </div>
              {isAir && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Customs & Extra</span>
                    <span className="font-bold text-emerald-400">+${customsTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Tax</span>
                    <span className="font-bold text-emerald-400">+${taxTotal.toFixed(2)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Discount</span>
                <span className="font-bold text-rose-400">-${(Number(formData.discount) || 0).toFixed(2)}</span>
              </div>
              <div className="pt-6 border-t border-slate-800/40 flex justify-between items-center">
                <span className="text-lg font-bold text-slate-200">Grand Total</span>
                <span className="text-3xl font-black text-[#F15D38]">${grandTotal.toFixed(2)}</span>
              </div>
            </div>
            <div className="space-y-3">
              <button onClick={handleSave} className="w-full py-4 bg-[#F15D38] hover:bg-[#d64420] text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-[#F15D38]/20">
                <Save size={20} /> Save Shipment
              </button>
              <button onClick={() => router.push('/admin/shipments')} className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-2xl text-xs font-bold transition-all uppercase tracking-widest border border-slate-800">
                Cancel
              </button>
            </div>
          </div>

          {/* Payment Card */}
          <div className="shipment-card">
            <div className="flex items-center gap-2 mb-6">
              <DollarSign size={18} className="text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Payment Details</h3>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Method</label>
                <select className="search-input !py-3" value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}>
                  <option value="ZAAD">Zaad Service</option>
                  <option value="EDAHAB">E-Dahab</option>
                  <option value="WAAFI">Waafi</option>
                  <option value="CASH">Cash Payment</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Discount ($)</label>
                <input type="number" className="search-input !py-3 font-bold text-rose-400" value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Amount Paid ($)</label>
                <input type="number" className="search-input !py-3 font-black text-emerald-400 text-lg" value={formData.paidAmount}
                  onChange={(e) => setFormData({ ...formData, paidAmount: Number(e.target.value) })} />
              </div>
              <div className={`p-5 rounded-2xl flex flex-col gap-1 ${balance <= 0 ? 'bg-emerald-950/30 border border-emerald-800/20' : 'bg-rose-950/30 border border-rose-800/20'}`}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Current Balance</p>
                <div className="flex items-center justify-between">
                  <p className={`text-3xl font-black ${balance <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ${Math.max(0, balance).toFixed(2)}
                  </p>
                  {balance <= 0 ? <CheckCircle2 size={28} className="text-emerald-500/30" /> : <AlertCircle size={28} className="text-rose-500/30" />}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
