'use client';

import { useState } from 'react';
import {
  BarChart3, Users, ShoppingBag, Search, Download, FileText,
  TrendingUp, Loader2, CheckCircle,
} from 'lucide-react';

type ReportType = 'full' | 'executive' | 'operations' | 'sales' | 'customers' | 'sourcing';

interface ReportCard {
  id:          ReportType;
  label:       string;
  description: string;
  icon:        React.ReactNode;
  accent:      string;
  slides:      string;
}

const REPORTS: ReportCard[] = [
  {
    id:          'full',
    label:       'Full Company Report',
    description: 'Complete deck: Executive Summary, Operations, Sales, Customers, and Sourcing in one professional report.',
    icon:        <FileText size={28} />,
    accent:      '#F15D38',
    slides:      '~18 slides',
  },
  {
    id:          'executive',
    label:       'Executive Summary',
    description: 'High-level KPIs for leadership — revenue, shipments, customers, collection rate, and batch performance.',
    icon:        <TrendingUp size={28} />,
    accent:      '#0d9488',
    slides:      '~3 slides',
  },
  {
    id:          'operations',
    label:       'Operations Report',
    description: 'Shipment status breakdown, AIR vs SEA mix, total cargo weight, batch status table, and delivery performance.',
    icon:        <BarChart3 size={28} />,
    accent:      '#0d9488',
    slides:      '~4 slides',
  },
  {
    id:          'sales',
    label:       'Sales & Revenue',
    description: 'Revenue totals, collection rate, payment method breakdown, paid vs unpaid invoices, and freight type revenue.',
    icon:        <ShoppingBag size={28} />,
    accent:      '#10B981',
    slides:      '~5 slides',
  },
  {
    id:          'customers',
    label:       'Customer Report',
    description: 'Customer overview, top 10 by revenue with invoiced vs collected chart, and full customer list.',
    icon:        <Users size={28} />,
    accent:      '#F59E0B',
    slides:      '~5 slides',
  },
  {
    id:          'sourcing',
    label:       'Sourcing Report',
    description: 'Quotation pipeline, conversion rate, commission earned, sourcing orders, and open pricing requests.',
    icon:        <Search size={28} />,
    accent:      '#8B5CF6',
    slides:      '~3 slides',
  },
];

export default function ReportsPage() {
  const [selected,    setSelected]    = useState<ReportType>('full');
  const [dateFrom,    setDateFrom]    = useState('');
  const [dateTo,      setDateTo]      = useState('');
  const [generating,  setGenerating]  = useState(false);
  const [lastGenerated, setLastGenerated] = useState('');

  const thisMonth = () => {
    const now = new Date();
    const y = now.getFullYear(), m = String(now.getMonth() + 1).padStart(2, '0');
    setDateFrom(`${y}-${m}-01`);
    setDateTo(new Date(y, now.getMonth() + 1, 0).toISOString().slice(0, 10));
  };

  const lastMonth = () => {
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0');
    setDateFrom(`${y}-${m}-01`);
    setDateTo(new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10));
  };

  const thisYear = () => {
    const y = new Date().getFullYear();
    setDateFrom(`${y}-01-01`);
    setDateTo(`${y}-12-31`);
  };

  const clearDates = () => { setDateFrom(''); setDateTo(''); };

  const generate = async () => {
    setGenerating(true);
    try {
      const params = new URLSearchParams({ type: selected });
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo)   params.set('to',   dateTo);

      const res = await fetch(`/api/reports/pptx?${params}`);
      if (!res.ok) throw new Error('Generation failed');

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = res.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] || 'QCargo-Report.pptx';
      a.click();
      URL.revokeObjectURL(url);
      setLastGenerated(new Date().toLocaleTimeString());
    } catch {
      alert('Failed to generate report. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const active = REPORTS.find(r => r.id === selected)!;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-100 tracking-tight">
          Executive Reports
        </h1>
        <p className="text-slate-400 text-sm font-bold mt-1">
          Generate professional branded PowerPoint presentations from live ERP data
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left: Report type selector */}
        <div className="xl:col-span-2 space-y-3">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Select Report Type</p>
          {REPORTS.map(r => (
            <button
              key={r.id}
              onClick={() => setSelected(r.id)}
              className={`w-full flex items-start gap-4 p-5 rounded-2xl border transition-all text-left ${
                selected === r.id
                  ? 'bg-[#131B2E] border-[#0d9488] shadow-lg shadow-[#0d9488]/10'
                  : 'bg-[#131B2E]/40 border-slate-800 hover:border-slate-600 hover:bg-[#131B2E]/70'
              }`}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={{ backgroundColor: `${r.accent}20`, color: r.accent, border: `1px solid ${r.accent}40` }}
              >
                {r.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-sm font-black text-slate-100">{r.label}</span>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                    {r.slides}
                  </span>
                  {r.id === 'full' && (
                    <span className="text-[10px] font-black text-[#F15D38] bg-[#F15D38]/10 border border-[#F15D38]/30 px-2 py-0.5 rounded-full">
                      RECOMMENDED
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">{r.description}</p>
              </div>
              {selected === r.id && (
                <div className="shrink-0 mt-1">
                  <CheckCircle size={18} className="text-[#0d9488]" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Right: Config + Generate */}
        <div className="space-y-6">
          {/* Selected report summary */}
          <div className="bg-[#131B2E] rounded-2xl border border-slate-800 p-6">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Selected Report</p>
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${active.accent}20`, color: active.accent }}
              >
                {active.icon}
              </div>
              <div>
                <p className="text-sm font-black text-slate-100">{active.label}</p>
                <p className="text-[10px] font-bold text-slate-500">{active.slides}</p>
              </div>
            </div>
            <div className="text-[10px] font-bold text-slate-500 bg-slate-900 rounded-xl p-3 leading-relaxed">
              {active.description}
            </div>
          </div>

          {/* Date Range */}
          <div className="bg-[#131B2E] rounded-2xl border border-slate-800 p-6">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Date Range</p>

            {/* Quick presets */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { label: 'This Month',  fn: thisMonth },
                { label: 'Last Month',  fn: lastMonth },
                { label: 'This Year',   fn: thisYear  },
                { label: 'All Time',    fn: clearDates },
              ].map(p => (
                <button
                  key={p.label}
                  onClick={p.fn}
                  className="text-[10px] font-black text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-3 py-2 transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 font-bold focus:outline-none focus:border-[#0d9488] transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 font-bold focus:outline-none focus:border-[#0d9488] transition-colors"
                />
              </div>
            </div>

            {(!dateFrom && !dateTo) && (
              <p className="text-[10px] font-bold text-[#0d9488] mt-3">
                No date filter — report will include all data
              </p>
            )}
          </div>

          {/* Generate button */}
          <button
            onClick={generate}
            disabled={generating}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-sm text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: generating ? '#1E293B' : 'linear-gradient(135deg, #0d9488, #0f766e)' }}
          >
            {generating ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Generating Report…
              </>
            ) : (
              <>
                <Download size={20} />
                Generate &amp; Download PPTX
              </>
            )}
          </button>

          {lastGenerated && !generating && (
            <p className="text-[10px] font-bold text-[#0d9488] text-center">
              ✓ Last generated at {lastGenerated}
            </p>
          )}

          {/* Branding note */}
          <div className="bg-[#0d9488]/5 border border-[#0d9488]/20 rounded-xl p-4">
            <p className="text-[10px] font-black text-[#0d9488] uppercase tracking-widest mb-2">Branding</p>
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
              Every report includes Q Cargo branding, teal &amp; orange color scheme,
              professional charts, KPI dashboards, and a branded cover &amp; closing slide.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
