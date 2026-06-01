'use client';

import { useMemo, useState } from 'react';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  Building2,
  Tag,
  BarChart3,
  Sparkles,
  Percent,
  Package,
  Scale,
  Box,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import ExpenseCharts from './ExpenseCharts';
import { formatPaymentMethod } from '@/lib/payment-methods';
import {
  type ExpensePeriod,
  filterExpensesByPeriod,
  computePeriodStats,
  periodChangePercent,
  dailySpendSeries,
  formatMonthLabel,
} from '@/lib/expense-analytics';
import {
  NET_MARGIN_RULES,
  filterShipmentsByPeriod,
  computeNetMargin,
  type ShipmentLike,
} from '@/lib/net-margin';

export interface IntelExpense {
  id: string;
  batchId: string;
  category: string;
  vendor: string;
  amount: number;
  date: string;
  status: 'PAID' | 'PENDING';
  paymentMethod: string;
}

export interface IntelShipment extends ShipmentLike {
  id: string;
}

interface ExpenseFinancialIntelProps {
  expenses: IntelExpense[];
  shipments?: IntelShipment[];
}

const PERIOD_OPTIONS: { id: ExpensePeriod; label: string }[] = [
  { id: 'this_month', label: 'This month' },
  { id: 'last_month', label: 'Last month' },
  { id: 'all', label: 'All time' },
];

function money(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function pct(n: number | null) {
  if (n == null) return '—';
  return `${n >= 0 ? '' : ''}${n.toFixed(1)}%`;
}

export default function ExpenseFinancialIntel({ expenses, shipments = [] }: ExpenseFinancialIntelProps) {
  const [period, setPeriod] = useState<ExpensePeriod>('this_month');
  const now = useMemo(() => new Date(), []);

  const periodExpenses = useMemo(
    () => filterExpensesByPeriod(expenses, period, now),
    [expenses, period, now]
  );

  const lastMonthExpenses = useMemo(
    () => filterExpensesByPeriod(expenses, 'last_month', now),
    [expenses, now]
  );

  const periodShipments = useMemo(
    () => filterShipmentsByPeriod(shipments, period, now),
    [shipments, period, now]
  );

  const stats = useMemo(() => computePeriodStats(periodExpenses), [periodExpenses]);
  const lastStats = useMemo(() => computePeriodStats(lastMonthExpenses), [lastMonthExpenses]);

  const margin = useMemo(
    () => computeNetMargin(periodShipments, stats.total),
    [periodShipments, stats.total]
  );

  const changeVsLastMonth = useMemo(() => {
    if (period !== 'this_month') return null;
    return periodChangePercent(stats.total, lastStats.total);
  }, [period, stats.total, lastStats.total]);

  const dailyData = useMemo(() => dailySpendSeries(periodExpenses), [periodExpenses]);

  const periodLabel = useMemo(() => {
    const y = now.getFullYear();
    const m = now.getMonth();
    if (period === 'this_month') return formatMonthLabel(y, m);
    if (period === 'last_month') {
      const lm = m === 0 ? 11 : m - 1;
      const ly = m === 0 ? y - 1 : y;
      return formatMonthLabel(ly, lm);
    }
    return 'All recorded expenses';
  }, [period, now]);

  const paidShare = stats.total > 0 ? (stats.paid / stats.total) * 100 : 0;

  const insights = useMemo(() => {
    const lines: string[] = [];
    if (stats.count === 0) {
      lines.push('No expenses in this period yet — record costs to unlock insights.');
      return lines;
    }
    lines.push(
      `${stats.count} transaction${stats.count === 1 ? '' : 's'} · average ${money(stats.avgTransaction)} per entry.`
    );
    if (stats.largest) {
      lines.push(`Largest outflow: ${stats.largest.vendor} (${money(stats.largest.amount)}).`);
    }
    lines.push(`Top category: ${stats.topCategory} · top vendor: ${stats.topVendor}.`);
    lines.push(`${paidShare.toFixed(0)}% of spend is marked paid; ${money(stats.pending)} still pending.`);
    if (changeVsLastMonth != null) {
      const dir = changeVsLastMonth >= 0 ? 'up' : 'down';
      lines.push(
        `Spending is ${dir} ${Math.abs(changeVsLastMonth).toFixed(1)}% vs last month (${money(lastStats.total)}).`
      );
    }
    if (margin.shipmentCount > 0) {
      lines.push(
        `Net margin ${pct(margin.netMarginPercent)} on ${money(margin.revenue)} freight (${margin.shipmentCount} shipment${margin.shipmentCount === 1 ? '' : 's'}).`
      );
    }
    return lines;
  }, [stats, paidShare, changeVsLastMonth, lastStats.total, margin]);

  const sortedPeriodRows = useMemo(
    () => [...periodExpenses].sort((a, b) => b.date.localeCompare(a.date) || b.amount - a.amount),
    [periodExpenses]
  );

  return (
    <section className="mb-10 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#F15D38] mb-2">
            <Sparkles size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Financial intelligence</span>
          </div>
          <h2 className="text-xl font-black text-slate-100 tracking-tight">{periodLabel}</h2>
          <p className="text-sm text-slate-400 font-medium mt-1">
            Period analytics — your existing ledger and charts below stay as they are.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setPeriod(opt.id)}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${
                period === opt.id
                  ? 'bg-[#F15D38] text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total spend', value: money(stats.total), icon: Wallet, accent: 'text-[#F15D38]' },
          { label: 'Transactions', value: String(stats.count), icon: Receipt, accent: 'text-slate-100' },
          { label: 'Paid', value: money(stats.paid), icon: TrendingDown, accent: 'text-emerald-400' },
          { label: 'Pending', value: money(stats.pending), icon: Calendar, accent: 'text-amber-400' },
          { label: 'Avg / entry', value: money(stats.avgTransaction), icon: BarChart3, accent: 'text-slate-100' },
          {
            label: period === 'this_month' ? 'vs last month' : 'Period',
            value:
              changeVsLastMonth != null
                ? `${changeVsLastMonth >= 0 ? '+' : ''}${changeVsLastMonth.toFixed(1)}%`
                : '—',
            icon: changeVsLastMonth != null && changeVsLastMonth >= 0 ? TrendingUp : TrendingDown,
            accent:
              changeVsLastMonth != null && changeVsLastMonth >= 0 ? 'text-rose-400' : 'text-emerald-400',
          },
        ].map((card) => (
          <div key={card.label} className="shipment-card border border-slate-800 !p-4">
            <card.icon size={16} className={`${card.accent} mb-2`} />
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{card.label}</p>
            <p className={`text-lg font-black mt-1 ${card.accent}`}>{card.value}</p>
          </div>
        ))}
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 shipment-card border border-slate-800 bg-[#131B2E]">
          <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest mb-6">
            Daily spend ({periodLabel})
          </h3>
          {dailyData.length === 0 ? (
            <p className="text-xs font-bold text-slate-500 text-center py-16">No dated expenses in this period.</p>
          ) : (
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0B0F19',
                      borderRadius: '12px',
                      border: '1px solid #334155',
                    }}
                    formatter={(value) => money(Number(value))}
                  />
                  <Bar dataKey="amount" fill="#F15D38" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="shipment-card border border-slate-800 bg-[#131B2E]">
          <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Sparkles size={16} className="text-[#F15D38]" />
            Insights
          </h3>
          <ul className="space-y-3">
            {insights.map((line, i) => (
              <li key={i} className="text-xs text-slate-300 leading-relaxed font-medium flex gap-2">
                <span className="text-[#F15D38] font-black shrink-0">•</span>
                {line}
              </li>
            ))}
          </ul>
          <div className="mt-6 pt-6 border-t border-slate-800 space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 font-bold flex items-center gap-1">
                <Tag size={12} /> Top category
              </span>
              <span className="font-black text-slate-200">{stats.topCategory}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 font-bold flex items-center gap-1">
                <Building2 size={12} /> Top vendor
              </span>
              <span className="font-black text-slate-200 truncate max-w-[140px]">{stats.topVendor}</span>
            </div>
          </div>
        </div>
      </div>

      <ExpenseCharts expenses={periodExpenses} />

      <div className="shipment-card !p-0 overflow-hidden border border-slate-800">
        <div className="px-8 py-5 border-b border-slate-800 bg-slate-900/40">
          <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest">
            Expenses in {periodLabel} ({sortedPeriodRows.length})
          </h3>
        </div>
        <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-slate-900 z-10">
              <tr className="border-b border-slate-800">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Vendor</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Category</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Paid via</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {sortedPeriodRows.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-800/30">
                  <td className="px-6 py-4 text-xs font-bold text-slate-400">{exp.date}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-100">{exp.vendor}</td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-300">{exp.category}</td>
                  <td className="px-6 py-4 text-xs font-bold text-indigo-300">
                    {formatPaymentMethod(exp.paymentMethod)}
                  </td>
                  <td className="px-6 py-4 text-right font-black text-slate-100">{money(exp.amount)}</td>
                </tr>
              ))}
              {sortedPeriodRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-xs font-bold text-slate-500">
                    No expenses for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
