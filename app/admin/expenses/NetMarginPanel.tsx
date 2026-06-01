'use client';

import {
  TrendingUp,
  Wallet,
  Receipt,
  Percent,
  Package,
  Scale,
  Box,
} from 'lucide-react';
import { NET_MARGIN_RULES, type NetMarginBreakdown } from '@/lib/net-margin';

function money(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function pct(n: number | null) {
  if (n == null) return '—';
  return `${n.toFixed(1)}%`;
}

interface NetMarginPanelProps {
  margin: NetMarginBreakdown;
}

export default function NetMarginPanel({ margin }: NetMarginPanelProps) {
  return (
    <div className="shipment-card border border-emerald-800/30 bg-gradient-to-br from-emerald-950/20 to-[#131B2E] !p-6">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-1">
            Net margin (modeled)
          </p>
          <p className="text-3xl font-black text-slate-100">
            {margin.netMarginPercent != null ? pct(margin.netMarginPercent) : '—'}
          </p>
          <p className="text-xs text-slate-400 font-medium mt-2 max-w-xl">
            7% of freight revenue + ${NET_MARGIN_RULES.profitPerCbm}/CBM + $
            {NET_MARGIN_RULES.profitPerKg}/KG, minus period expenses.
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Net profit</p>
          <p
            className={`text-2xl font-black ${margin.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
          >
            {money(margin.netProfit)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          {
            label: 'Freight revenue',
            value: money(margin.revenue),
            icon: Package,
            accent: 'text-slate-100',
          },
          {
            label: '7% of revenue',
            value: money(margin.profitFromRevenue),
            icon: Percent,
            accent: 'text-emerald-300',
          },
          {
            label: `${margin.totalKg.toLocaleString()} KG × $${NET_MARGIN_RULES.profitPerKg}`,
            value: money(margin.profitFromKg),
            icon: Scale,
            accent: 'text-sky-300',
          },
          {
            label: `${margin.totalCbm.toLocaleString()} CBM × $${NET_MARGIN_RULES.profitPerCbm}`,
            value: money(margin.profitFromCbm),
            icon: Box,
            accent: 'text-amber-300',
          },
          {
            label: 'Gross profit',
            value: money(margin.grossProfit),
            icon: TrendingUp,
            accent: 'text-emerald-400',
          },
          {
            label: 'Expenses',
            value: money(margin.expenses),
            icon: Wallet,
            accent: 'text-[#F15D38]',
          },
          {
            label: 'Shipments',
            value: String(margin.shipmentCount),
            icon: Receipt,
            accent: 'text-slate-300',
          },
          {
            label: 'Net margin',
            value: pct(margin.netMarginPercent),
            icon: Percent,
            accent:
              margin.netMarginPercent != null && margin.netMarginPercent >= 0
                ? 'text-emerald-400'
                : 'text-rose-400',
          },
        ].map((row) => (
          <div key={row.label} className="rounded-xl bg-slate-900/60 border border-slate-800 p-3">
            <row.icon size={14} className={`${row.accent} mb-1.5`} />
            <p className="text-[8px] font-bold text-slate-500 uppercase leading-tight">{row.label}</p>
            <p className={`text-sm font-black mt-1 ${row.accent}`}>{row.value}</p>
          </div>
        ))}
      </div>

      {margin.shipmentCount === 0 && (
        <p className="text-xs font-bold text-slate-500 mt-4 text-center">
          No shipments dated in this period — net margin uses freight totals from shipment records.
        </p>
      )}
    </div>
  );
}
