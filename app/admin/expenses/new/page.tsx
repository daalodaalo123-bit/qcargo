'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  Save,
  DollarSign,
  Tag,
  Calendar,
  FileText,
  Hash,
  AlertCircle,
  TrendingDown,
  Info,
  CreditCard,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { EXPENSE_PAYMENT_METHODS } from '@/lib/payment-methods';

const EXPENSE_CATEGORY_PRESETS = [
  { value: 'Customs', label: 'Customs & Clearing' },
  { value: 'Trucking', label: 'Local Trucking' },
  { value: 'Warehousing', label: 'Warehouse Rent' },
  { value: 'Sourcing', label: 'Sourcing Agent Fee' },
  { value: 'Marketing', label: 'Marketing & Ads' },
  { value: 'Port Taxes', label: 'Berbera Port Taxes / Fees' },
  { value: 'Other', label: 'Other Expenses' },
] as const;

export default function NewExpensePage() {
  const router = useRouter();
  const [savedCategories, setSavedCategories] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/bills')
      .then(r => r.json())
      .then((bills: { category?: string }[]) => {
        const presets = EXPENSE_CATEGORY_PRESETS.map(p => p.value);
        const custom = [...new Set(
          bills
            .map(b => b.category?.trim())
            .filter((c): c is string => !!c && !presets.includes(c))
        )].sort();
        setSavedCategories(custom);
      })
      .catch(() => {});
  }, []);

  const [formData, setFormData] = useState({
    batchId: '',
    category: 'Customs',
    amount: '',
    amountPaid: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    paymentMethod: 'CASH',
    vendor: '',
  });

  const totalAmount = parseFloat(formData.amount) || 0;
  const paidAmount = parseFloat(formData.amountPaid) || 0;
  const remaining = Math.max(0, totalAmount - paidAmount);
  const derivedStatus = paidAmount <= 0 ? 'PENDING' : paidAmount >= totalAmount - 0.01 ? 'PAID' : 'PARTIAL';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vendor.trim()) {
      alert('Please enter a vendor name');
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Please enter a valid expense amount');
      return;
    }
    if (!formData.category.trim()) {
      alert('Please enter or select a category');
      return;
    }

    const payload = {
      vendor: formData.vendor,
      date: formData.date,
      due: formData.date,
      amount: totalAmount,
      amountPaid: paidAmount,
      status: derivedStatus,
      category: formData.category.trim(),
      paymentMethod: formData.paymentMethod,
      batchId: formData.batchId.trim() || 'GENERAL',
      description: formData.description.trim(),
    };

    try {
      const res = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save expense');
      }
      alert(`Expense successfully logged for ${formData.vendor}!`);
      router.push('/admin/expenses');
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="admin-container pb-20">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-100 tracking-tight">Record Expense</h1>
            <p className="text-slate-400 font-medium font-sans">Log operational costs and vendor bills by batch</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-[#F15D38]/10 text-[#F15D38] border border-[#F15D38]/20 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest">
          <TrendingDown size={14} />
          Operational Cost
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Expense Details */}
          <div className="shipment-card border border-slate-800 bg-[#131B2E]">
            <div className="flex items-center gap-2 mb-8 pb-4 border-b border-slate-800/40">
              <DollarSign size={20} className="text-[#F15D38]" />
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Expense Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Amount (USD)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="number" 
                    required
                    className="search-input !pl-12 font-black text-2xl text-rose-500" 
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Category</label>
                <div className="space-y-2">
                  <div className="relative">
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={18} />
                    <select
                      className="search-input !pl-12 w-full"
                      value={formData.category}
                      onChange={(e) => {
                        if (e.target.value) setFormData({ ...formData, category: e.target.value });
                      }}
                    >
                      <option value="">Quick pick…</option>
                      <optgroup label="── Common ──">
                        {EXPENSE_CATEGORY_PRESETS.map((preset) => (
                          <option key={preset.value} value={preset.value}>
                            {preset.label}
                          </option>
                        ))}
                      </optgroup>
                      {savedCategories.length > 0 && (
                        <optgroup label="── Your Categories ──">
                          {savedCategories.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                  <input
                    type="text"
                    required
                    className="search-input w-full"
                    placeholder="Or type your own category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    list="expense-category-suggestions"
                  />
                  <datalist id="expense-category-suggestions">
                    {EXPENSE_CATEGORY_PRESETS.map((preset) => (
                      <option key={preset.value} value={preset.value} />
                    ))}
                    {savedCategories.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
                <p className="text-[10px] text-slate-500 mt-2 font-medium">
                  Use the dropdown for common categories, or type any custom name in the field.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Linked Batch ID</label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="text" 
                    className="search-input !pl-12 font-mono" 
                    placeholder="e.g. FLT-2024-001"
                    value={formData.batchId}
                    onChange={(e) => setFormData({...formData, batchId: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Expense Date</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="date" 
                    className="search-input !pl-12"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Vendor & Description */}
          <div className="shipment-card border border-slate-800 bg-[#131B2E]">
            <div className="flex items-center gap-2 mb-8 pb-4 border-b border-slate-800/40">
              <FileText size={20} className="text-[#F15D38]" />
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Additional Info</h3>
            </div>

            <div className="mb-8">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Vendor / Service Provider</label>
              <input 
                type="text" 
                required
                className="search-input" 
                placeholder="e.g. Hargeisa Port Authority"
                value={formData.vendor}
                onChange={(e) => setFormData({...formData, vendor: e.target.value})}
              />
            </div>

            <div className="mb-8">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">How we paid</label>
              <div className="relative">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={18} />
                <select
                  className="search-input !pl-12 w-full"
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                >
                  {EXPENSE_PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">How Much Have You Paid?</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="number"
                  min={0}
                  max={totalAmount || undefined}
                  step="0.01"
                  className="search-input !pl-12 w-full"
                  placeholder="0.00  — leave at 0 if nothing paid yet"
                  value={formData.amountPaid}
                  onChange={e => setFormData({ ...formData, amountPaid: e.target.value })}
                />
              </div>
              {totalAmount > 0 && (
                <div className="mt-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex justify-between items-center">
                  <span className="text-slate-400">Status will be saved as</span>
                  <span className={`font-black px-3 py-1 rounded-full border ${
                    derivedStatus === 'PAID'
                      ? 'bg-emerald-950/30 text-emerald-400 border-emerald-800/20'
                      : derivedStatus === 'PARTIAL'
                      ? 'bg-blue-950/30 text-blue-400 border-blue-800/20'
                      : 'bg-amber-950/30 text-amber-400 border-amber-800/20'
                  }`}>
                    {derivedStatus === 'PAID' ? '✓ PAID' : derivedStatus === 'PARTIAL' ? `PARTIAL · $${remaining.toFixed(2)} still owed` : 'PENDING · nothing paid yet'}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Description / Notes</label>
              <textarea 
                className="search-input min-h-[120px] !p-6" 
                placeholder="Details about this expenditure..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              ></textarea>
            </div>
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-8">
          <div className="bg-[#131B2E] border border-slate-800 rounded-[2.5rem] p-10 shadow-xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-10">Financial Impact</h3>
            
            <div className="space-y-6 mb-12">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Category</span>
                <span className="text-xs font-black px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-200">
                  {formData.category.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Payment Method</span>
                <span className="font-bold text-sm text-slate-200">{formData.paymentMethod}</span>
              </div>
              {paidAmount > 0 && paidAmount < totalAmount && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Paid now</span>
                  <span className="font-bold text-sm text-emerald-400">${paidAmount.toFixed(2)}</span>
                </div>
              )}
              {remaining > 0 && totalAmount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Still owed</span>
                  <span className="font-bold text-sm text-amber-400">${remaining.toFixed(2)}</span>
                </div>
              )}
              <div className="pt-6 border-t border-slate-800/40 flex justify-between items-center">
                <span className="text-sm text-slate-400">Total Expense</span>
                <span className="text-3xl font-black text-rose-500">
                  -${totalAmount.toLocaleString()}
                </span>
              </div>
            </div>

            <button type="submit" className="w-full py-5 bg-[#F15D38] hover:bg-[#d64420] rounded-2xl font-black text-white shadow-lg shadow-[#F15D38]/20 transition-all flex items-center justify-center gap-3">
              <Save size={20} />
              Save Expense
            </button>
          </div>

          <div className="bg-[#131B2E] border border-slate-800 rounded-[2.5rem] p-8">
            <div className="flex items-center gap-3 text-amber-500 mb-4">
              <AlertCircle size={24} />
              <h4 className="font-bold text-slate-200">Audit Notice</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Recorded expenses reduce net margin on the Accounting page (7% revenue + $50/CBM + $1.50/KG minus costs). Keep a valid receipt for every transaction.
            </p>
          </div>

          <div className="p-8 rounded-[2.5rem] bg-[#131B2E]/50 border border-slate-800 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-[#131B2E] rounded-2xl shadow-sm flex items-center justify-center text-[#F15D38] border border-slate-800 mb-4">
              <Info size={32} />
            </div>
            <h4 className="font-bold text-slate-200 mb-2">Linked Accounting</h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed">
              This expense will be automatically categorized in your General Ledger.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
