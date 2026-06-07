'use client';

import { useState, useEffect } from 'react';
import { X, User, Phone, Package, DollarSign, Loader2, Save } from 'lucide-react';

interface QuotationItem {
  description: string;
  qty: string;
  price: string;
}

export interface EditQuotationData {
  id: string;
  customer: string;
  phone?: string;
  goods: string;
  price: number;
  type: 'AIR' | 'SEA';
  status: 'SENT' | 'DRAFT' | 'APPROVED' | 'REJECTED';
}

interface EditQuotationModalProps {
  quotation: EditQuotationData | null;
  onClose: () => void;
  onSuccess: () => void;
}

function lineTotal(item: QuotationItem): number {
  return (parseFloat(item.qty) || 0) * (parseFloat(item.price) || 0);
}

export default function EditQuotationModal({ quotation, onClose, onSuccess }: EditQuotationModalProps) {
  const [customer, setCustomer] = useState('');
  const [phone, setPhone] = useState('');
  const [items, setItems] = useState<QuotationItem[]>([{ description: '', qty: '1', price: '' }]);
  const [estimatedPrice, setEstimatedPrice] = useState('');
  const [freightType, setFreightType] = useState<'AIR' | 'SEA'>('SEA');
  const [status, setStatus] = useState<'SENT' | 'DRAFT' | 'APPROVED' | 'REJECTED'>('DRAFT');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!quotation) return;
    setCustomer(quotation.customer);
    setPhone(quotation.phone || '');
    setFreightType(quotation.type);
    setStatus(quotation.status);
    setError('');

    // Fetch full quotation (includes items array)
    setFetching(true);
    fetch(`/api/quotations/${quotation.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.items && data.items.length > 0) {
          setItems(
            data.items.map((it: { description: string; qty: number; price: number }) => ({
              description: it.description,
              qty: String(it.qty),
              price: String(it.price),
            }))
          );
          const total = data.items.reduce(
            (sum: number, it: { qty: number; price: number }) => sum + it.qty * it.price,
            0
          );
          setEstimatedPrice(total > 0 ? String(total) : String(data.price || quotation.price));
        } else {
          setItems([{ description: data.goods || quotation.goods, qty: '1', price: String(data.price || quotation.price) }]);
          setEstimatedPrice(String(data.price || quotation.price));
        }
      })
      .catch(() => {
        setItems([{ description: quotation.goods, qty: '1', price: String(quotation.price) }]);
        setEstimatedPrice(String(quotation.price));
      })
      .finally(() => setFetching(false));
  }, [quotation?.id]);

  // Auto-update estimated price from items
  useEffect(() => {
    const total = items.reduce((acc, item) => acc + lineTotal(item), 0);
    if (total > 0) setEstimatedPrice(String(total));
  }, [items]);

  if (!quotation) return null;

  const updateItem = (index: number, field: keyof QuotationItem, value: string) => {
    setItems(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const addItem = () => setItems([...items, { description: '', qty: '1', price: '' }]);

  const removeItem = (index: number) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!customer.trim()) {
      setError('Customer name is required');
      return;
    }

    const priceNum = parseFloat(estimatedPrice) || 0;
    const goodsText =
      items
        .filter((it) => it.description.trim())
        .map((it) => `${it.qty || 1}x ${it.description}`)
        .join(', ') || 'General Cargo';

    const payload = {
      customer: customer.trim(),
      phone: phone.trim(),
      goods: goodsText,
      price: priceNum,
      type: freightType,
      status,
      items: items
        .filter((it) => it.description.trim())
        .map((it) => ({
          description: it.description.trim(),
          qty: parseFloat(it.qty) || 1,
          price: parseFloat(it.price) || 0,
        })),
    };

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/quotations/${quotation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update quotation');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-[#131B2E] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0B0F19]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#F15D38]/10 text-[#F15D38]">
              <Package size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-100 uppercase tracking-wider">Edit Quotation</h2>
              <p className="text-[10px] text-slate-500 font-bold">{quotation.customer}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-200 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {fetching ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-[#F15D38]" />
            </div>
          ) : (
            <>
              {/* Customer Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Customer Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                    <input
                      type="text"
                      className="search-input !pl-9"
                      placeholder="e.g. Hassan Ahmed"
                      value={customer}
                      onChange={(e) => setCustomer(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">WhatsApp / Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                    <input
                      type="text"
                      className="search-input !pl-9"
                      placeholder="+252 ..."
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-3">Items</label>
                <div className="hidden sm:grid sm:grid-cols-12 gap-3 mb-1 px-1">
                  <span className="sm:col-span-6 text-[10px] font-bold text-slate-500 uppercase">Description</span>
                  <span className="sm:col-span-2 text-[10px] font-bold text-slate-500 uppercase">Qty</span>
                  <span className="sm:col-span-3 text-[10px] font-bold text-slate-500 uppercase">Price (USD)</span>
                  <span className="sm:col-span-1" />
                </div>
                {items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-3 p-3 bg-[#0B0F19] rounded-xl border border-slate-800 items-end">
                    <div className="sm:col-span-6">
                      <input
                        type="text"
                        placeholder="e.g. Solar panels"
                        className="search-input !py-2 min-w-0 text-sm"
                        value={item.description}
                        onChange={(e) => updateItem(idx, 'description', e.target.value)}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        min={1}
                        placeholder="1"
                        className="search-input !py-2 min-w-0 text-sm"
                        value={item.qty}
                        onChange={(e) => updateItem(idx, 'qty', e.target.value)}
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="0.00"
                        className="search-input !py-2 min-w-0 text-sm"
                        value={item.price}
                        onChange={(e) => updateItem(idx, 'price', e.target.value)}
                      />
                    </div>
                    <div className="sm:col-span-1 flex sm:justify-end">
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        disabled={items.length === 1}
                        className="text-rose-500 hover:text-rose-400 p-1.5 hover:bg-rose-950/20 rounded-lg disabled:opacity-30 disabled:pointer-events-none"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addItem}
                  className="w-full py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition-colors"
                >
                  + Add Item
                </button>
              </div>

              {/* Price, Freight, Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Total Price (USD)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                    <input
                      type="number"
                      className="search-input !pl-9"
                      placeholder="0.00"
                      value={estimatedPrice}
                      onChange={(e) => setEstimatedPrice(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Freight Type</label>
                  <select
                    className="search-input w-full"
                    value={freightType}
                    onChange={(e) => setFreightType(e.target.value as 'AIR' | 'SEA')}
                  >
                    <option value="SEA">Sea Freight</option>
                    <option value="AIR">Air Freight</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Status</label>
                  <select
                    className="search-input w-full"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'SENT' | 'DRAFT' | 'APPROVED' | 'REJECTED')}
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="SENT">Sent</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              </div>

              {error && <p className="text-xs text-rose-400 font-bold">{error}</p>}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 text-slate-400 text-xs font-bold uppercase hover:text-slate-200"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 py-3 bg-[#F15D38] hover:bg-[#d64420] disabled:opacity-60 text-white rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 transition-all"
                >
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
