'use client';

import { useState, useEffect } from 'react';
import { X, Save, Loader2, Plus, Trash2 } from 'lucide-react';

type RawLine = Record<string, unknown>;

export interface ShipmentRow {
  id: string;
  shipmentNumber: string;
  customer: string;
  phone?: string;
  type: 'AIR' | 'SEA';
  status: 'ARRIVED' | 'IN_TRANSIT' | 'PENDING';
  payment: 'PAID' | 'UNPAID';
  total: number;
  batch: string;
  date: string;
  notes?: string;
  weight?: number;
  cbm?: number;
  rate?: number;
  customs?: number;
  tax?: number;
  discount?: number;
  priceLines?: RawLine[];
  items?: RawLine[];
  courierPackages?: RawLine[];
}

interface CargoLine {
  description: string;
  trackingNumber: string;
  qty: number;
  weight: number;
  cbm: number;
  value: number;
}

// One priced product line — product name + measure (KG/CBM) + rate (+ customs/tax for AIR).
interface PriceLine {
  product: string;
  weight: number;
  cbm: number;
  rate: number;
  amount: number; // freight subtotal (units × rate); source of truth for the total
  customs: number;
  tax: number;
}

const emptyPriceLine = (): PriceLine => ({ product: '', weight: 0, cbm: 0, rate: 0, amount: 0, customs: 0, tax: 0 });

const round2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;

interface EditShipmentModalProps {
  shipment: ShipmentRow | null;
  onClose: () => void;
  onSaved: () => void;
}

const emptyLine = (): CargoLine => ({ description: '', trackingNumber: '', qty: 1, weight: 0, cbm: 0, value: 0 });

const str = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v));
const numOf = (v: unknown) => (typeof v === 'number' && !isNaN(v) ? v : Number(v) || 0);

// Merge the shipment's items[] and courierPackages[] back into one editable
// line per product. Tracking numbers live on courierPackages; weight/cbm/value
// on items — we pair them by matching goods/description.
function buildLines(shipment: ShipmentRow): CargoLine[] {
  const items = shipment.items || [];
  const couriers = [...(shipment.courierPackages || [])];
  const lines: CargoLine[] = items.map((it) => {
    const desc = str(it.description);
    const idx = couriers.findIndex((c) => str(c.goods) === desc);
    let cp: RawLine | undefined;
    if (idx >= 0) { cp = couriers[idx]; couriers.splice(idx, 1); }
    return {
      description: desc,
      trackingNumber: cp ? str(cp.trackingNumber) : '',
      qty: numOf(it.qty) || 1,
      weight: numOf(it.weight),
      cbm: numOf(it.cbm),
      value: numOf(it.value),
    };
  });
  // Any courier packages with no matching item become their own line
  couriers.forEach((cp) => {
    lines.push({
      description: str(cp.goods),
      trackingNumber: str(cp.trackingNumber),
      qty: numOf(cp.qty) || 1,
      weight: 0,
      cbm: 0,
      value: 0,
    });
  });
  return lines.length > 0 ? lines : [emptyLine()];
}

// Pre-fill the pricing table. New shipments carry priceLines; older ones are
// reconstructed as a single line from the flat freight fields so editing works.
function buildPriceLines(shipment: ShipmentRow): PriceLine[] {
  const isAir = shipment.type === 'AIR';
  const raw = shipment.priceLines || [];
  if (raw.length > 0) {
    return raw.map((l) => {
      const weight = numOf(l.weight);
      const cbm = numOf(l.cbm);
      const rate = numOf(l.rate);
      const units = isAir ? weight : cbm;
      // Use the stored amount; fall back to units × rate for older lines.
      const amount = numOf((l as RawLine).amount) || round2(units * rate);
      return { product: str(l.product), weight, cbm, rate, amount, customs: numOf(l.customs), tax: numOf(l.tax) };
    });
  }
  const firstGoods = str((shipment.items?.[0] as RawLine | undefined)?.description) || 'Cargo';
  const weight = numOf(shipment.weight);
  const cbm = numOf(shipment.cbm);
  const rate = numOf(shipment.rate);
  return [{
    product: firstGoods,
    weight,
    cbm,
    rate,
    amount: round2((isAir ? weight : cbm) * rate),
    customs: numOf(shipment.customs),
    tax: numOf(shipment.tax),
  }];
}

// Warehouse-set fields we must NOT wipe when the goods list is edited.
const PRESERVE = ['measuredWeight', 'measuredCbm', 'warehouseNotes', 'received', 'receivedAt'] as const;
function carryOver(target: RawLine, source: RawLine | undefined): RawLine {
  if (source) for (const k of PRESERVE) if (source[k] !== undefined) target[k] = source[k];
  return target;
}

export default function EditShipmentModal({ shipment, onClose, onSaved }: EditShipmentModalProps) {
  const [customer, setCustomer] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState<'AIR' | 'SEA'>('SEA');
  const [status, setStatus] = useState<'ARRIVED' | 'IN_TRANSIT' | 'PENDING'>('PENDING');
  const [payment, setPayment] = useState<'PAID' | 'UNPAID'>('UNPAID');
  const [discount, setDiscount] = useState('0');
  const [batch, setBatch] = useState('UNASSIGNED');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<CargoLine[]>([emptyLine()]);
  const [priceLines, setPriceLines] = useState<PriceLine[]>([emptyPriceLine()]);
  const [products, setProducts] = useState<string[]>([]);
  const [batches, setBatches] = useState<string[]>(['UNASSIGNED']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!shipment) return;
    setCustomer(shipment.customer);
    setPhone(shipment.phone || '');
    setType(shipment.type);
    setStatus(shipment.status);
    setPayment(shipment.payment);
    setDiscount(String(shipment.discount ?? 0));
    setBatch(shipment.batch || 'UNASSIGNED');
    setDate(shipment.date);
    setNotes(shipment.notes || '');
    setLines(buildLines(shipment));
    setPriceLines(buildPriceLines(shipment));
    setError('');

    fetch('/api/batches')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const ids = ['UNASSIGNED', ...data.map((b: { batchId: string }) => b.batchId)];
        setBatches([...new Set(ids)]);
      })
      .catch(() => setBatches(['UNASSIGNED', shipment.batch].filter(Boolean)));

    fetch('/api/products')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setProducts([]));
  }, [shipment]);

  if (!shipment) return null;

  const updateLine = (i: number, field: keyof CargoLine, value: string | number) => {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));
  };
  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (i: number) => setLines((prev) => (prev.length === 1 ? [emptyLine()] : prev.filter((_, idx) => idx !== i)));

  const isAir = type === 'AIR';

  // Keep rate ⇄ amount in sync: edit Rate/units → amount recalculates; edit the
  // Total → rate is worked out (cleared when the line has no weight/CBM).
  const updatePriceLine = (i: number, field: keyof PriceLine, value: string | number) =>
    setPriceLines((prev) => prev.map((l, idx) => {
      if (idx !== i) return l;
      const line: PriceLine = { ...l, [field]: value } as PriceLine;
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
      return line;
    }));
  const addPriceLine = () => setPriceLines((prev) => [...prev, emptyPriceLine()]);
  const removePriceLine = (i: number) =>
    setPriceLines((prev) => (prev.length === 1 ? [emptyPriceLine()] : prev.filter((_, idx) => idx !== i)));

  const lineFreight = (l: PriceLine) =>
    l.amount != null && l.amount !== 0
      ? Number(l.amount) || 0
      : (isAir ? Number(l.weight) || 0 : Number(l.cbm) || 0) * (Number(l.rate) || 0);
  const freightTotal = priceLines.reduce((s, l) => s + lineFreight(l), 0);
  const customsTotal = isAir ? priceLines.reduce((s, l) => s + (Number(l.customs) || 0), 0) : 0;
  const taxTotal = isAir ? priceLines.reduce((s, l) => s + (Number(l.tax) || 0), 0) : 0;
  const grandTotal = freightTotal + customsTotal + taxTotal - (Number(discount) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.trim()) { setError('Customer name is required'); return; }
    if (!phone.trim()) { setError('Phone number is required'); return; }

    const origItems = shipment.items || [];
    const origCouriers = shipment.courierPackages || [];

    // items[] — every line with a description (preserve warehouse fields by description match)
    const items = lines
      .filter((l) => l.description.trim())
      .map((l) => {
        const base: RawLine = {
          description: l.description.trim(),
          qty: l.qty || 1,
          weight: l.weight || 0,
          cbm: l.cbm || 0,
          value: l.value || 0,
        };
        return carryOver(base, origItems.find((it) => str(it.description) === l.description.trim()));
      });

    // courierPackages[] — every line that has a tracking number (preserve by tracking match)
    const courierPackages = lines
      .filter((l) => l.trackingNumber.trim())
      .map((l) => {
        const base: RawLine = {
          trackingNumber: l.trackingNumber.trim(),
          goods: l.description.trim(),
          qty: l.qty || 1,
          courier: '',
        };
        const src = origCouriers.find((c) => str(c.trackingNumber) === l.trackingNumber.trim())
          || origItems.find((it) => str(it.description) === l.description.trim());
        if (src && origCouriers.find((c) => str(c.trackingNumber) === l.trackingNumber.trim())) {
          base.courier = str((origCouriers.find((c) => str(c.trackingNumber) === l.trackingNumber.trim()) as RawLine).courier);
        }
        return carryOver(base, src);
      });

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/shipments?id=${shipment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: customer.trim(),
          phone: phone.trim(),
          type,
          status,
          payment,
          total: grandTotal,
          weight: priceLines.reduce((s, l) => s + (Number(l.weight) || 0), 0),
          cbm: priceLines.reduce((s, l) => s + (Number(l.cbm) || 0), 0),
          rate: priceLines[0]?.rate || 0,
          customs: customsTotal,
          tax: taxTotal,
          discount: Number(discount) || 0,
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
          batch,
          date,
          notes: notes.trim() || undefined,
          items,
          courierPackages,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.details || 'Failed to update shipment');
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-[#131B2E] border border-slate-800 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 sticky top-0 bg-[#131B2E] z-10">
          <div>
            <h2 className="text-sm font-black text-slate-100 uppercase tracking-wider">Edit Shipment</h2>
            <p className="text-[10px] font-mono text-[#F15D38] mt-0.5">{shipment.shipmentNumber}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-200 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Customer</label>
            <input type="text" className="search-input w-full" value={customer} onChange={(e) => setCustomer(e.target.value)} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Phone</label>
            <input type="text" className="search-input w-full" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Freight Type</label>
              <select className="search-input w-full" value={type} onChange={(e) => setType(e.target.value as 'AIR' | 'SEA')}>
                <option value="AIR">Air</option>
                <option value="SEA">Sea</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status</label>
              <select
                className="search-input w-full"
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
              >
                <option value="PENDING">Pending</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="ARRIVED">Arrived</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Payment</label>
              <select
                className="search-input w-full"
                value={payment}
                onChange={(e) => setPayment(e.target.value as 'PAID' | 'UNPAID')}
              >
                <option value="UNPAID">Unpaid</option>
                <option value="PAID">Paid</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Discount (USD)</label>
              <input
                type="number"
                step="0.01"
                min={0}
                className="search-input w-full"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Batch</label>
              <select className="search-input w-full" value={batch} onChange={(e) => setBatch(e.target.value)}>
                {batches.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Date</label>
              <input type="date" className="search-input w-full" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          {/* Pricing — one row per product, each with its own rate (Sea hides Customs & Tax) */}
          <div className="border border-slate-800 rounded-xl p-4 bg-[#0B0F19]/40">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-[10px] font-black text-slate-300 uppercase tracking-wider">
                Pricing · {isAir ? 'Weight × Rate' : 'CBM × Rate'} per product
              </label>
              <button
                type="button"
                onClick={addPriceLine}
                className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-dashed border-slate-700 hover:border-[#F15D38] text-slate-400 hover:text-[#F15D38] rounded-lg text-[11px] font-bold transition-all"
              >
                <Plus size={13} /> Add product
              </button>
            </div>

            <div className="space-y-2.5">
              {priceLines.map((line, i) => {
                const lineTotal = lineFreight(line) + (isAir ? (Number(line.customs) || 0) + (Number(line.tax) || 0) : 0);
                return (
                  <div key={i} className="bg-[#131B2E] border border-slate-800 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        list="edit-product-suggestions"
                        value={line.product}
                        onChange={(e) => updatePriceLine(i, 'product', e.target.value)}
                        placeholder="Product name (e.g. Bags)"
                        className="search-input flex-1 !py-2 !text-xs"
                      />
                      <span className="shrink-0 text-xs font-black text-emerald-400 w-20 text-right">${lineTotal.toFixed(2)}</span>
                      <button
                        type="button"
                        onClick={() => removePriceLine(i)}
                        className="shrink-0 p-2 text-slate-500 hover:text-rose-400 transition-colors"
                        title="Remove product"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div className={`grid gap-2 ${isAir ? 'grid-cols-5' : 'grid-cols-3'}`}>
                      <label className="flex flex-col gap-1">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">{isAir ? 'Weight (KG)' : 'CBM'}</span>
                        <input
                          type="number" min={0} step="any"
                          value={isAir ? line.weight : line.cbm}
                          onChange={(e) => updatePriceLine(i, isAir ? 'weight' : 'cbm', Number(e.target.value))}
                          className="search-input w-full !py-1.5 !text-xs text-center"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Rate $</span>
                        <input
                          type="number" min={0} step="any"
                          value={line.rate}
                          onChange={(e) => updatePriceLine(i, 'rate', Number(e.target.value))}
                          className="search-input w-full !py-1.5 !text-xs text-center"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-wider">Total $</span>
                        <input
                          type="number" min={0} step="any"
                          value={line.amount}
                          onChange={(e) => updatePriceLine(i, 'amount', Number(e.target.value))}
                          className="search-input w-full !py-1.5 !text-xs text-center font-black text-emerald-400"
                          title="Type the total to set it directly — the rate is worked out for you"
                        />
                      </label>
                      {isAir && (
                        <>
                          <label className="flex flex-col gap-1">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Customs $</span>
                            <input
                              type="number" min={0} step="any"
                              value={line.customs}
                              onChange={(e) => updatePriceLine(i, 'customs', Number(e.target.value))}
                              className="search-input w-full !py-1.5 !text-xs text-center"
                            />
                          </label>
                          <label className="flex flex-col gap-1">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Tax $</span>
                            <input
                              type="number" min={0} step="any"
                              value={line.tax}
                              onChange={(e) => updatePriceLine(i, 'tax', Number(e.target.value))}
                              className="search-input w-full !py-1.5 !text-xs text-center"
                            />
                          </label>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <datalist id="edit-product-suggestions">
              {products.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Grand Total</span>
              <span className="text-lg font-black text-[#F15D38]">${grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Goods / Items */}
          <div className="border border-slate-800 rounded-xl p-4 bg-[#0B0F19]/40">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-[10px] font-black text-slate-300 uppercase tracking-wider">Goods / Items</label>
              <button
                type="button"
                onClick={addLine}
                className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-dashed border-slate-700 hover:border-[#F15D38] text-slate-400 hover:text-[#F15D38] rounded-lg text-[11px] font-bold transition-all"
              >
                <Plus size={13} /> Add product
              </button>
            </div>

            <div className="space-y-2.5">
              {lines.map((line, i) => (
                <div key={i} className="bg-[#131B2E] border border-slate-800 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={line.description}
                      onChange={(e) => updateLine(i, 'description', e.target.value)}
                      placeholder="Product description"
                      className="search-input flex-1 !py-2 !text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => removeLine(i)}
                      className="shrink-0 p-2 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Remove product"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={line.trackingNumber}
                    onChange={(e) => updateLine(i, 'trackingNumber', e.target.value)}
                    placeholder="Tracking number (optional)"
                    className="search-input w-full font-mono !py-2 !text-xs"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <label className="flex flex-col gap-1">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Qty</span>
                      <input
                        type="number" min={1} step={1}
                        value={line.qty}
                        onChange={(e) => updateLine(i, 'qty', Number(e.target.value))}
                        className="search-input w-full !py-1.5 !text-xs text-center"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">{isAir ? 'Weight (KG)' : 'CBM'}</span>
                      <input
                        type="number" min={0} step="any"
                        value={isAir ? line.weight : line.cbm}
                        onChange={(e) => updateLine(i, isAir ? 'weight' : 'cbm', Number(e.target.value))}
                        className="search-input w-full !py-1.5 !text-xs text-center"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Value $</span>
                      <input
                        type="number" min={0} step="0.01"
                        value={line.value}
                        onChange={(e) => updateLine(i, 'value', Number(e.target.value))}
                        className="search-input w-full !py-1.5 !text-xs text-center"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-2.5">
              {isAir ? 'Air shipment — enter KG.' : 'Sea shipment — enter CBM.'} Each product can have its own tracking number.
            </p>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Notes</label>
            <textarea
              className="search-input w-full min-h-[72px] resize-y"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
            />
          </div>
          {error && <p className="text-xs text-rose-400 font-bold">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-slate-400 text-xs font-bold uppercase">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-[#F15D38] hover:bg-[#d64420] disabled:opacity-60 text-white rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
