'use client';

import { useState, useEffect } from 'react';
import { Save, Check } from 'lucide-react';

export interface FinanceSettings {
  rates: { CNY: number; AED: number };
  vatEnabled: boolean;
  vatRate: number;
  vatLabel: string;
  openingCashBalance: number;
}

export default function SetupTab({ settings, onSaved }: { settings: FinanceSettings | null; onSaved: () => void }) {
  const [cny, setCny] = useState('7.10');
  const [aed, setAed] = useState('3.67');
  const [opening, setOpening] = useState('0');
  const [vatEnabled, setVatEnabled] = useState(false);
  const [vatRate, setVatRate] = useState('0');
  const [vatLabel, setVatLabel] = useState('VAT');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Converter
  const [amt, setAmt] = useState('100');
  const [from, setFrom] = useState<'USD' | 'CNY' | 'AED'>('USD');

  useEffect(() => {
    if (!settings) return;
    setCny(String(settings.rates.CNY));
    setAed(String(settings.rates.AED));
    setOpening(String(settings.openingCashBalance));
    setVatEnabled(settings.vatEnabled);
    setVatRate(String(settings.vatRate));
    setVatLabel(settings.vatLabel);
  }, [settings]);

  const save = async () => {
    setSaving(true); setSaved(false);
    try {
      const res = await fetch('/api/finance/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rates: { CNY: Number(cny), AED: Number(aed) },
          openingCashBalance: Number(opening),
          vatEnabled,
          vatRate: Number(vatRate),
          vatLabel,
        }),
      });
      if (res.ok) { setSaved(true); onSaved(); setTimeout(() => setSaved(false), 2500); }
      else { const d = await res.json().catch(() => ({})); alert(d.error || 'Failed to save'); }
    } finally { setSaving(false); }
  };

  // Live conversion from the typed-in rates
  const rCny = Number(cny) || 0;
  const rAed = Number(aed) || 0;
  const a = Number(amt) || 0;
  const usd = from === 'USD' ? a : from === 'CNY' ? (rCny ? a / rCny : 0) : (rAed ? a / rAed : 0);
  const conv = { USD: usd, CNY: usd * rCny, AED: usd * rAed };

  const field = 'w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[#0d9488] transition-colors';
  const label = 'block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2';

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-3xl">
      <div>
        <h2 className="text-xl font-black text-slate-100">Finance Setup</h2>
        <p className="text-slate-400 text-sm mt-1">Exchange rates, opening balance and tax settings used across the financial reports.</p>
      </div>

      {/* Exchange rates */}
      <div className="shipment-card border border-slate-800 bg-[#131B2E] space-y-5">
        <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest">Exchange Rates (base USD)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>1 USD = ___ CNY (Chinese Yuan)</label>
            <input className={field} type="number" step="0.01" value={cny} onChange={e => setCny(e.target.value)} />
          </div>
          <div>
            <label className={label}>1 USD = ___ AED (UAE Dirham)</label>
            <input className={field} type="number" step="0.01" value={aed} onChange={e => setAed(e.target.value)} />
          </div>
        </div>
        <p className="text-[11px] text-slate-500">Update these whenever the rate changes. They drive the currency conversions shown on the Overview.</p>
      </div>

      {/* Opening balance */}
      <div className="shipment-card border border-slate-800 bg-[#131B2E] space-y-3">
        <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest">Opening Cash / Bank Balance</h3>
        <div className="max-w-xs">
          <label className={label}>Cash + bank + Zaad/eDahab on hand (USD)</label>
          <input className={field} type="number" step="0.01" value={opening} onChange={e => setOpening(e.target.value)} />
        </div>
        <p className="text-[11px] text-slate-500">Your starting cash. The Balance Sheet adds money collected and subtracts money paid out from this number.</p>
      </div>

      {/* VAT */}
      <div className="shipment-card border border-slate-800 bg-[#131B2E] space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest">Sales Tax / VAT</h3>
          <button type="button" onClick={() => setVatEnabled(v => !v)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${vatEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
            {vatEnabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>
        {vatEnabled && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={label}>Tax rate %</label>
              <input className={field} type="number" step="0.1" value={vatRate} onChange={e => setVatRate(e.target.value)} />
            </div>
            <div>
              <label className={label}>Label</label>
              <input className={field} type="text" value={vatLabel} onChange={e => setVatLabel(e.target.value)} placeholder="VAT / Sales Tax" />
            </div>
          </div>
        )}
        <p className="text-[11px] text-slate-500">Off by default. When enabled, the Tax tab estimates tax on your revenue for filing.</p>
      </div>

      <button onClick={save} disabled={saving}
        className="flex items-center gap-2 px-6 py-3 bg-[#0d9488] hover:bg-[#0f766e] disabled:opacity-50 text-white text-sm font-black rounded-xl transition-colors">
        {saved ? <Check size={16} /> : <Save size={16} />}{saved ? 'Saved!' : saving ? 'Saving…' : 'Save Settings'}
      </button>

      {/* Currency converter */}
      <div className="shipment-card border border-slate-800 bg-[#131B2E] space-y-4">
        <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest">Quick Currency Converter</h3>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className={label}>Amount</label>
            <input className={`${field} w-40`} type="number" value={amt} onChange={e => setAmt(e.target.value)} />
          </div>
          <div>
            <label className={label}>From</label>
            <select className={`${field} w-32`} value={from} onChange={e => setFrom(e.target.value as 'USD' | 'CNY' | 'AED')}>
              <option value="USD">USD</option>
              <option value="CNY">CNY</option>
              <option value="AED">AED</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {(['USD', 'CNY', 'AED'] as const).map(c => (
            <div key={c} className="bg-slate-900/60 rounded-xl px-4 py-3 text-center">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{c}</p>
              <p className="text-lg font-black text-slate-100 mt-1">{conv[c].toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
