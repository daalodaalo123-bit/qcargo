'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, DollarSign, CreditCard, Search, MoreVertical,
  Download, Building2, PieChart, CheckCircle2, AlertCircle, BarChart3,
  Landmark, Users, Trash2, Scale, Wallet, Percent, Settings, Banknote,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import ExpenseFinancialIntel, {
  type IntelExpense,
  type IntelShipment,
} from '@/app/admin/expenses/ExpenseFinancialIntel';
import {
  computeLiveOverview,
  buildMonthlyFreightChart,
  buildChartOfAccountsLive,
} from '@/lib/accounting-summary';
import { parseExpenseDate } from '@/lib/expense-analytics';
import SetupTab, { type FinanceSettings } from './SetupTab';
import BalanceSheetTab from './BalanceSheetTab';
import BudgetTab from './BudgetTab';
import TaxTab from './TaxTab';
import BankRecTab from './BankRecTab';

type TabType = 'overview' | 'invoices' | 'bills' | 'accounts' | 'ar-aging' | 'ap-aging' | 'pl-statement' | 'cashflow' | 'credit-limits' | 'balance-sheet' | 'budget' | 'tax' | 'bank-rec' | 'setup';
type PLPeriod = 'this_month' | 'last_month' | 'this_year' | 'all';

interface Invoice {
  id: string;
  mongoId?: string;
  customer: string;
  date: string;
  due: string;
  amount: number;
  status: 'PAID' | 'PARTIAL' | 'UNPAID';
  paymentMethod?: string;
  amountPaidThisReceipt?: number;
  balanceDue?: number;
  receiptPdfUrl?: string;
}

interface Bill {
  id: string;
  vendor: string;
  date: string;
  due: string;
  amount: number;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  category: string;
  paymentMethod?: string;
  batchId?: string;
}

function daysFromToday(dateStr: string): number {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function agingBucket(days: number) {
  if (days <= 0) return { label: 'Current',    color: 'text-emerald-400', bg: 'bg-emerald-950/20', border: 'border-emerald-800/20' };
  if (days <= 30) return { label: '1–30 days', color: 'text-amber-400',   bg: 'bg-amber-950/20',   border: 'border-amber-800/20' };
  if (days <= 60) return { label: '31–60 days',color: 'text-orange-400',  bg: 'bg-orange-950/20',  border: 'border-orange-800/20' };
  if (days <= 90) return { label: '61–90 days',color: 'text-rose-400',    bg: 'bg-rose-950/20',    border: 'border-rose-800/20' };
  return           { label: '90+ days',         color: 'text-red-400',     bg: 'bg-red-950/30',     border: 'border-red-800/30' };
}

const PL_PERIOD_LABELS: Record<PLPeriod, string> = {
  this_month: 'This Month',
  last_month: 'Last Month',
  this_year:  'This Year',
  all:        'All Time',
};

export default function AccountingPage() {
  const [activeTab, setActiveTab]   = useState<TabType>('overview');
  const [invoices, setInvoices]     = useState<Invoice[]>([]);
  const [bills, setBills]           = useState<Bill[]>([]);
  const [shipments, setShipments]   = useState<IntelShipment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [plPeriod, setPlPeriod]     = useState<PLPeriod>('this_month');
  const [customers, setCustomers]           = useState<{ _id: string; name: string; phone: string; creditLimit?: number }[]>([]);
  const [editingCreditId, setEditingCreditId] = useState<string | null>(null);
  const [creditInputVal, setCreditInputVal]   = useState('');
  const [settings, setSettings]               = useState<FinanceSettings | null>(null);

  const loadSettings = async () => {
    try { const res = await fetch('/api/finance/settings'); if (res.ok) setSettings(await res.json()); } catch (e) { console.error(e); }
  };

  const loadBills = async () => {
    try {
      const res = await fetch('/api/bills');
      if (!res.ok) return;
      const data = await res.json();
      setBills(data.map((b: Record<string, unknown>) => ({
        id:            String(b._id || b.id),
        vendor:        String(b.vendor || ''),
        date:          String(b.date || ''),
        due:           String(b.due || ''),
        amount:        Number(b.amount) || 0,
        status:        (b.status as Bill['status']) || 'PENDING',
        category:      String(b.category || 'General'),
        paymentMethod: String(b.paymentMethod || 'CASH'),
        batchId:       String(b.batchId || 'GENERAL'),
      })));
    } catch (e) { console.error(e); }
  };

  const loadInvoices = async () => {
    try {
      const res = await fetch('/api/invoices');
      if (!res.ok) return;
      const data = await res.json();
      setInvoices(data.map((inv: {
        _id: string; invoiceNumber: string; customerName: string;
        paymentDate: string; totalAmount: number; amountPaid?: number;
        balanceDue?: number; paymentStatus: string; paymentMethod?: string;
        receiptPdfUrl?: string; createdAt?: string;
      }) => ({
        id:                  inv.invoiceNumber,
        mongoId:             inv._id,
        customer:            inv.customerName,
        date:                inv.paymentDate || inv.createdAt?.split('T')[0] || '',
        due:                 inv.paymentDate || '',
        amount:              inv.totalAmount || 0,
        status:              inv.paymentStatus === 'PAID' ? 'PAID' as const : inv.paymentStatus === 'PARTIAL' ? 'PARTIAL' as const : 'UNPAID' as const,
        paymentMethod:       inv.paymentMethod,
        amountPaidThisReceipt: inv.amountPaid,
        balanceDue:          inv.balanceDue,
        receiptPdfUrl:       inv.receiptPdfUrl,
      })));
    } catch (e) { console.error(e); }
  };

  const loadShipments = async () => {
    try {
      const res = await fetch('/api/shipments');
      if (!res.ok) return;
      const data = await res.json();
      setShipments(data.map((s: Record<string, unknown>) => ({
        id:     String(s._id || s.id),
        date:   String(s.date || ''),
        total:  Number(s.total) || 0,
        type:   String(s.type || 'AIR'),
        weight: Number(s.weight) || 0,
        cbm:    Number(s.cbm) || 0,
        batch:  String(s.batch || 'UNASSIGNED'),
      })));
    } catch (e) { console.error(e); }
  };

  const loadCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      if (!res.ok) return;
      const data = await res.json();
      setCustomers(data);
    } catch (e) { console.error(e); }
  };

  const handleDeleteInvoice = async (mongoId: string, invoiceNum: string) => {
    if (!confirm(`Delete invoice ${invoiceNum}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/invoices?id=${mongoId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setInvoices(prev => prev.filter(i => i.mongoId !== mongoId));
    } catch (e) { alert('Failed to delete invoice'); }
  };

  useEffect(() => { loadBills(); loadInvoices(); loadShipments(); loadCustomers(); loadSettings(); }, []);

  const intelExpenses: IntelExpense[] = bills.map((b) => ({
    id: b.id, batchId: b.batchId || 'GENERAL', category: b.category,
    vendor: b.vendor, amount: b.amount, date: b.date,
    status: b.status === 'PAID' ? 'PAID' : 'PENDING',
    paymentMethod: b.paymentMethod || 'CASH',
  }));

  const expenseRows = useMemo(() => bills.map((b) => ({
    amount: b.amount, date: b.date, batchId: b.batchId,
    status: b.status, category: b.category, vendor: b.vendor,
  })), [bills]);

  const invoiceRows = useMemo(() => invoices.map((inv) => ({
    date: inv.date, amount: inv.amount, status: inv.status,
    amountPaid: inv.amountPaidThisReceipt,
  })), [invoices]);

  const totalReceivables = useMemo(() =>
    invoices.filter(i => i.status !== 'PAID').reduce((s, i) => s + (i.balanceDue ?? i.amount), 0),
  [invoices]);

  const totalPayables = useMemo(() =>
    bills.filter(b => b.status !== 'PAID').reduce((s, b) => s + b.amount, 0),
  [bills]);

  // Lifetime cash for the Balance Sheet: collected from customers, paid to vendors.
  const lifetimeCashIn = useMemo(() =>
    invoices.reduce((s, inv) => inv.status === 'PAID' ? s + inv.amount : inv.status === 'PARTIAL' ? s + (inv.amountPaidThisReceipt ?? 0) : s, 0),
  [invoices]);
  const lifetimeCashOut = useMemo(() =>
    bills.filter(b => b.status === 'PAID').reduce((s, b) => s + b.amount, 0),
  [bills]);

  const liveMonth = useMemo(() =>
    computeLiveOverview(shipments, invoiceRows, expenseRows, totalReceivables, totalPayables, 'this_month'),
  [shipments, invoiceRows, expenseRows, totalReceivables, totalPayables]);

  const revenueChart    = useMemo(() => buildMonthlyFreightChart(shipments), [shipments]);
  const freightAllTime  = useMemo(() => shipments.reduce((s, sh) => s + sh.total, 0), [shipments]);
  const expensesAllTime = useMemo(() => bills.reduce((s, b) => s + b.amount, 0), [bills]);
  const chartOfAccounts = useMemo(() =>
    buildChartOfAccountsLive(freightAllTime, expensesAllTime, totalReceivables, totalPayables),
  [freightAllTime, expensesAllTime, totalReceivables, totalPayables]);

  // ── AR AGING ─────────────────────────────────────────────────────────────
  const arAgingData = useMemo(() => {
    const unpaid = invoices.filter(i => i.status !== 'PAID');
    const rows   = unpaid.map(inv => ({ ...inv, days: daysFromToday(inv.due || inv.date), bucket: agingBucket(daysFromToday(inv.due || inv.date)) }));
    const totals = { current: { count: 0, amount: 0 }, b1_30: { count: 0, amount: 0 }, b31_60: { count: 0, amount: 0 }, b61_90: { count: 0, amount: 0 }, b90plus: { count: 0, amount: 0 } };
    for (const r of rows) {
      const bal = r.balanceDue ?? r.amount;
      if (r.days <= 0)       { totals.current.count++; totals.current.amount += bal; }
      else if (r.days <= 30) { totals.b1_30.count++;   totals.b1_30.amount   += bal; }
      else if (r.days <= 60) { totals.b31_60.count++;  totals.b31_60.amount  += bal; }
      else if (r.days <= 90) { totals.b61_90.count++;  totals.b61_90.amount  += bal; }
      else                   { totals.b90plus.count++;  totals.b90plus.amount  += bal; }
    }
    return { rows: rows.sort((a, b) => b.days - a.days), totals };
  }, [invoices]);

  // ── AP AGING ─────────────────────────────────────────────────────────────
  const apAgingData = useMemo(() => {
    const unpaid = bills.filter(b => b.status !== 'PAID');
    const rows   = unpaid.map(b => ({ ...b, days: daysFromToday(b.due || b.date), bucket: agingBucket(daysFromToday(b.due || b.date)) }));
    const totals = { current: { count: 0, amount: 0 }, b1_30: { count: 0, amount: 0 }, b31_60: { count: 0, amount: 0 }, b61_90: { count: 0, amount: 0 }, b90plus: { count: 0, amount: 0 } };
    for (const r of rows) {
      if (r.days <= 0)       { totals.current.count++; totals.current.amount += r.amount; }
      else if (r.days <= 30) { totals.b1_30.count++;   totals.b1_30.amount   += r.amount; }
      else if (r.days <= 60) { totals.b31_60.count++;  totals.b31_60.amount  += r.amount; }
      else if (r.days <= 90) { totals.b61_90.count++;  totals.b61_90.amount  += r.amount; }
      else                   { totals.b90plus.count++;  totals.b90plus.amount  += r.amount; }
    }
    return { rows: rows.sort((a, b) => b.days - a.days), totals };
  }, [bills]);

  // ── CREDIT LIMITS ─────────────────────────────────────────────────────────
  const creditData = useMemo(() => {
    return customers.map(c => {
      const outstanding = invoices
        .filter(inv => inv.customer === c.name && inv.status !== 'PAID')
        .reduce((s, inv) => s + (inv.balanceDue ?? inv.amount), 0);
      const limit   = c.creditLimit ?? 0;
      const utilPct = limit > 0 ? (outstanding / limit) * 100 : null;
      return { ...c, outstanding, utilPct };
    }).sort((a, b) => b.outstanding - a.outstanding);
  }, [customers, invoices]);

  // ── P&L ──────────────────────────────────────────────────────────────────
  const plData = useMemo(() => {
    const now  = new Date();
    const keep = (ds: string) => {
      const d = parseExpenseDate(ds);
      if (!d) return false;
      if (plPeriod === 'this_month') return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      if (plPeriod === 'last_month') { const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1); return d.getFullYear() === lm.getFullYear() && d.getMonth() === lm.getMonth(); }
      if (plPeriod === 'this_year')  return d.getFullYear() === now.getFullYear();
      return true;
    };
    const fs = shipments.filter(s  => keep(s.date));
    const fb = bills.filter(b      => keep(b.date));
    const fi = invoices.filter(inv => keep(inv.date));
    const totalRevenue  = fs.reduce((s, sh) => s + sh.total, 0);
    const totalExpenses = fb.reduce((s, b)  => s + b.amount, 0);
    const cashCollected = fi.reduce((s, inv) => inv.status === 'PAID' ? s + inv.amount : inv.status === 'PARTIAL' ? s + (inv.amountPaidThisReceipt ?? 0) : s, 0);
    const grossProfit   = totalRevenue - totalExpenses;
    const marginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : null;
    const byCategory: Record<string, number> = {};
    for (const b of fb) byCategory[b.category] = (byCategory[b.category] || 0) + b.amount;
    const categoryBreakdown = Object.entries(byCategory).map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);
    return { totalRevenue, totalExpenses, cashCollected, grossProfit, marginPercent, categoryBreakdown, shipmentCount: fs.length };
  }, [plPeriod, shipments, bills, invoices]);

  // ── CASH FLOW ─────────────────────────────────────────────────────────────
  const cashFlowChart = useMemo(() => {
    const months = 6;
    const ref    = new Date();
    const inB: Record<string, number>  = {};
    const outB: Record<string, number> = {};
    for (const inv of invoices) {
      const d = parseExpenseDate(inv.date);
      if (!d) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
      inB[key] = (inB[key] || 0) + (inv.status === 'PAID' ? inv.amount : (inv.amountPaidThisReceipt ?? 0));
    }
    for (const b of bills) {
      if (b.status !== 'PAID') continue;
      const d = parseExpenseDate(b.date);
      if (!d) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
      outB[key] = (outB[key] || 0) + b.amount;
    }
    let totalIn = 0, totalOut = 0;
    const points = [];
    for (let i = months - 1; i >= 0; i--) {
      const d      = new Date(ref.getFullYear(), ref.getMonth() - i, 1);
      const key    = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
      const cashIn = inB[key] || 0;
      const cashOut= outB[key] || 0;
      totalIn += cashIn; totalOut += cashOut;
      points.push({ name: d.toLocaleDateString('en-US', { month: 'short' }), 'Cash In': cashIn, 'Cash Out': cashOut });
    }
    return { points, totalIn, totalOut, net: totalIn - totalOut };
  }, [invoices, bills]);

  // ── INVOICE SUMMARY ───────────────────────────────────────────────────────
  const invoiceSummary = useMemo(() => {
    const paid    = invoices.filter(i => i.status === 'PAID');
    const partial = invoices.filter(i => i.status === 'PARTIAL');
    const unpaid  = invoices.filter(i => i.status === 'UNPAID');
    return {
      paid:    { count: paid.length,    amount: paid.reduce((s, i)    => s + i.amount, 0) },
      partial: { count: partial.length, amount: partial.reduce((s, i) => s + (i.balanceDue ?? i.amount), 0) },
      unpaid:  { count: unpaid.length,  amount: unpaid.reduce((s, i)  => s + (i.balanceDue ?? i.amount), 0) },
    };
  }, [invoices]);

  const money = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleExport = () => {
    let rows: string[][];
    let filename: string;
    if (activeTab === 'invoices') {
      rows = [['Invoice #','Customer','Date','Amount ($)','Status','Payment Method'], ...invoices.map(i => [i.id, i.customer, i.date, String(i.amount), i.status, i.paymentMethod || ''])];
      filename = `qcargo_invoices_${new Date().toISOString().slice(0,10)}.csv`;
    } else if (activeTab === 'bills') {
      rows = [['Vendor','Category','Amount ($)','Date','Due','Status','Batch'], ...bills.map(b => [b.vendor, b.category, String(b.amount), b.date, b.due, b.status, b.batchId || ''])];
      filename = `qcargo_bills_${new Date().toISOString().slice(0,10)}.csv`;
    } else if (activeTab === 'ar-aging') {
      rows = [['Customer','Invoice #','Amount ($)','Balance Due ($)','Due Date','Days','Bucket'], ...arAgingData.rows.map(r => [r.customer, r.id, String(r.amount), String(r.balanceDue ?? r.amount), r.due, String(Math.max(0, r.days)), r.bucket.label])];
      filename = `qcargo_ar_aging_${new Date().toISOString().slice(0,10)}.csv`;
    } else if (activeTab === 'ap-aging') {
      rows = [['Vendor','Category','Amount ($)','Due Date','Days','Bucket'], ...apAgingData.rows.map(r => [r.vendor, r.category, String(r.amount), r.due, String(Math.max(0, r.days)), r.bucket.label])];
      filename = `qcargo_ap_aging_${new Date().toISOString().slice(0,10)}.csv`;
    } else if (activeTab === 'credit-limits') {
      rows = [['Customer','Phone','Outstanding ($)','Credit Limit ($)','Utilization %','Status'], ...creditData.map(c => [c.name, c.phone, String(c.outstanding), String(c.creditLimit ?? 0), c.utilPct != null ? `${c.utilPct.toFixed(0)}%` : '—', c.utilPct != null && c.utilPct >= 100 ? 'OVER LIMIT' : c.utilPct != null && c.utilPct >= 80 ? 'NEAR LIMIT' : c.outstanding === 0 ? 'CLEAR' : 'OK'])];
      filename = `qcargo_credit_limits_${new Date().toISOString().slice(0,10)}.csv`;
    } else if (activeTab === 'pl-statement') {
      rows = [['Q Cargo — P&L'],['Period', PL_PERIOD_LABELS[plPeriod]],[],['INCOME'],['Freight Revenue', String(plData.totalRevenue)],['Cash Collected', String(plData.cashCollected)],[],['EXPENSES'],...plData.categoryBreakdown.map(c => [c.category, String(c.amount)]),['TOTAL EXPENSES', String(plData.totalExpenses)],[],['NET PROFIT', String(plData.grossProfit)],['NET MARGIN %', plData.marginPercent != null ? `${plData.marginPercent.toFixed(1)}%` : 'N/A']];
      filename = `qcargo_pl_${plPeriod}_${new Date().toISOString().slice(0,10)}.csv`;
    } else {
      rows = [['Metric','Value'],['Freight (this month)', String(liveMonth.freightRevenue)],['Cash collected', String(liveMonth.cashCollected)],['Expenses', String(liveMonth.expenses)],['Net profit', String(liveMonth.netProfit)],['Outstanding invoices', String(totalReceivables)],['Unpaid bills', String(totalPayables)]];
      filename = `qcargo_accounting_${new Date().toISOString().slice(0,10)}.csv`;
    }
    const csv  = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.href  = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    link.download = filename;
    link.click();
  };

  const TABS = [
    { id: 'overview',      name: 'Overview',      icon: PieChart    },
    { id: 'invoices',      name: 'Invoices',       icon: DollarSign  },
    { id: 'bills',         name: 'Vendor Bills',   icon: CreditCard  },
    { id: 'accounts',      name: 'Accounts',       icon: Building2   },
    { id: 'ar-aging',      name: 'AR Aging',       icon: AlertCircle },
    { id: 'ap-aging',      name: 'AP Aging',       icon: Landmark    },
    { id: 'credit-limits', name: 'Credit Limits',  icon: Users       },
    { id: 'pl-statement',  name: 'P&L',            icon: BarChart3   },
    { id: 'cashflow',      name: 'Cash Flow',      icon: TrendingUp  },
    { id: 'balance-sheet', name: 'Balance Sheet',  icon: Scale       },
    { id: 'budget',        name: 'Budget',         icon: Wallet      },
    { id: 'tax',           name: 'Tax',            icon: Percent     },
    { id: 'bank-rec',      name: 'Bank Rec',       icon: Banknote    },
    { id: 'setup',         name: 'Setup',          icon: Settings    },
  ];

  return (
    <div className="admin-container pb-20">

      {/* Header — view only, no add/edit actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight">Financial Reports</h1>
          <p className="text-slate-400 font-medium font-sans">Read-only view · To record payments go to Shipments or Quotations · To manage expenses go to Expenses</p>
        </div>
        <button type="button" onClick={handleExport} className="btn bg-white border border-slate-800 text-slate-300 flex items-center gap-2 hover:bg-slate-800 shadow-sm">
          <Download size={18} /> Export CSV
        </button>
      </div>

      <ExpenseFinancialIntel
        expenses={intelExpenses}
        shipments={shipments}
        showNetMargin
        showAccountingExtras
        hideExpenseTable
        description="This month: spend, freight, net margin, and efficiency."
      />

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-900 border border-slate-800 rounded-[1.5rem] mb-10 overflow-x-auto max-w-full">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id as TabType); setSearchTerm(''); }}
            className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'bg-[#F15D38] text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}>
            <tab.icon size={13} />{tab.name}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div className="space-y-10 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: 'Freight (this month)',    value: money(liveMonth.freightRevenue), trend: 'Live',     icon: TrendingUp, color: 'text-[#F15D38]',   bg: 'bg-[#F15D38]/10 border border-[#F15D38]/20' },
              { label: 'Cash in (this month)',    value: money(liveMonth.cashCollected),  trend: 'Invoices', icon: DollarSign, color: 'text-sky-400',      bg: 'bg-sky-950/20 border border-sky-800/20' },
              { label: 'Outstanding invoices',    value: money(totalReceivables),         trend: 'Due',      icon: AlertCircle,color: 'text-amber-400',    bg: 'bg-amber-950/20 border border-amber-800/20' },
              { label: 'Net profit (this month)', value: money(liveMonth.netProfit),      trend: liveMonth.netMarginPercent != null ? `${liveMonth.netMarginPercent.toFixed(1)}% margin` : '—', icon: TrendingUp, color: liveMonth.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400', bg: 'bg-emerald-950/20 border border-emerald-800/20' },
            ].map(stat => (
              <div key={stat.label} className={`shipment-card ${stat.bg}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-2xl ${stat.color}`}><stat.icon size={24} /></div>
                  <span className={`text-[10px] font-black px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 ${stat.color}`}>{stat.trend}</span>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                <h3 className="text-2xl font-black text-slate-100 mt-1">{stat.value}</h3>
              </div>
            ))}
          </div>

          {/* Multi-currency snapshot */}
          {settings && (
            <div className="shipment-card border border-slate-800 bg-[#131B2E]">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest">In Other Currencies</h3>
                <button onClick={() => setActiveTab('setup')} className="text-[10px] font-black text-[#0d9488] uppercase tracking-widest hover:underline">Edit rates</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Freight (this month)',    usd: liveMonth.freightRevenue },
                  { label: 'Cash in (this month)',    usd: liveMonth.cashCollected  },
                  { label: 'Net profit (this month)', usd: liveMonth.netProfit       },
                ].map(item => (
                  <div key={item.label} className="bg-slate-900/60 rounded-xl p-4">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.label}</p>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm font-black text-slate-100">{money(item.usd)} <span className="text-slate-500 text-[10px]">USD</span></p>
                      <p className="text-xs font-bold text-slate-300">¥{(item.usd * settings.rates.CNY).toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-slate-500 text-[10px]">CNY</span></p>
                      <p className="text-xs font-bold text-slate-300">{(item.usd * settings.rates.AED).toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-slate-500 text-[10px]">AED</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 shipment-card border border-slate-800 bg-[#131B2E]">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest">Freight Revenue — Last 6 Months</h3>
                <span className="px-3 py-1 bg-slate-900 border border-slate-800 text-[10px] font-black uppercase rounded-lg text-[#F15D38]">From shipments</span>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueChart}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#F15D38" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#F15D38" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#131B2E', borderRadius: '16px', border: '1px solid #1e293b' }} labelStyle={{ color: '#f1f5f9', fontWeight: 'bold' }} />
                    <Area type="monotone" dataKey="amount" stroke="#F15D38" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Payables snapshot — view only */}
            <div className="shipment-card border border-slate-800 bg-[#131B2E]">
              <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest mb-2">Pending Payables</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">View only · manage in Expenses</p>
              <div className="space-y-5">
                {bills.filter(b => b.status !== 'PAID').slice(0, 5).map(bill => {
                  const days = daysFromToday(bill.due);
                  return (
                    <div key={bill.id} className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                          <Building2 size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-200">{bill.vendor}</p>
                          <p className="text-[10px] font-bold mt-0.5">
                            {days > 0 ? <span className="text-rose-400">{days}d overdue</span> : <span className="text-slate-500">Due {bill.due}</span>}
                          </p>
                        </div>
                      </div>
                      <span className="font-black text-sm text-slate-100">${bill.amount.toLocaleString()}</span>
                    </div>
                  );
                })}
                {bills.filter(b => b.status !== 'PAID').length === 0 && (
                  <p className="text-xs font-bold text-slate-500 text-center py-6">No pending bills</p>
                )}
              </div>
              <div className="mt-8 pt-6 border-t border-slate-800/40">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Total unpaid: {money(totalPayables)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── VENDOR BILLS (read only) ── */}
      {activeTab === 'bills' && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-3 px-5 py-3 bg-slate-900/60 border border-slate-800 rounded-2xl text-xs font-bold text-slate-400">
            <CreditCard size={16} className="text-slate-500" />
            This is a read-only view. To add or edit vendor bills, go to <span className="text-[#F15D38] ml-1">Expenses</span>.
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#F15D38] transition-colors" size={20} />
            <input type="text" placeholder="Search by vendor or category…" className="search-input !pl-12 w-full" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>

          <div className="shipment-card !p-0 overflow-hidden border border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-900/40 border-b border-slate-800">
                    {['Vendor / Category','Date','Due Date','Status','Amount'].map(h => (
                      <th key={h} className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {bills
                    .filter(b => b.vendor.toLowerCase().includes(searchTerm.toLowerCase()) || b.category.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(bill => {
                      const days      = daysFromToday(bill.due);
                      const isOverdue = bill.status !== 'PAID' && days > 0;
                      return (
                        <tr key={bill.id} className={`hover:bg-slate-800/20 transition-all ${isOverdue ? 'border-l-2 border-rose-500/50' : ''}`}>
                          <td className="px-6 py-5">
                            <p className="font-bold text-slate-100">{bill.vendor}</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">{bill.category}</p>
                          </td>
                          <td className="px-6 py-5 text-xs font-bold text-slate-400">{bill.date}</td>
                          <td className="px-6 py-5">
                            <p className="text-xs font-bold text-slate-400">{bill.due}</p>
                            {isOverdue && <p className="text-[10px] font-black text-rose-400 mt-0.5">{days}d overdue</p>}
                          </td>
                          <td className="px-6 py-5">
                            <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-full ${
                              bill.status === 'PAID'  ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-800/20'
                              : isOverdue             ? 'bg-rose-950/30 text-rose-400 border border-rose-800/20'
                              :                         'bg-amber-950/30 text-amber-400 border border-amber-800/20'
                            }`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${bill.status === 'PAID' ? 'bg-emerald-500' : isOverdue ? 'bg-rose-500' : 'bg-amber-500'}`} />
                              {bill.status === 'PAID' ? 'PAID' : isOverdue ? 'OVERDUE' : 'PENDING'}
                            </span>
                          </td>
                          <td className="px-6 py-5 font-black text-slate-100">${bill.amount.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  {bills.length === 0 && <tr><td colSpan={5} className="px-6 py-12 text-center text-xs font-bold text-slate-500">No vendor bills recorded.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── CUSTOMER INVOICES (read only) ── */}
      {activeTab === 'invoices' && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Paid',                d: invoiceSummary.paid,    color: 'text-emerald-400', bg: 'bg-emerald-950/20 border-emerald-800/20', sub: 'Total collected' },
              { label: 'Partial — Balance Due', d: invoiceSummary.partial, color: 'text-amber-400',   bg: 'bg-amber-950/20 border-amber-800/20',   sub: 'Remaining owed' },
              { label: 'Unpaid',               d: invoiceSummary.unpaid,  color: 'text-rose-400',    bg: 'bg-rose-950/20 border-rose-800/20',     sub: 'Not yet paid' },
            ].map(s => (
              <div key={s.label} className={`shipment-card border ${s.bg} py-4`}>
                <p className={`text-[10px] font-black uppercase tracking-widest ${s.color}`}>{s.label}</p>
                <p className="text-xl font-black text-slate-100 mt-1">{money(s.d.amount)}</p>
                <p className="text-[10px] font-bold text-slate-500 mt-0.5">{s.d.count} invoice{s.d.count !== 1 ? 's' : ''} · {(s as any).sub}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 px-5 py-3 bg-slate-900/60 border border-slate-800 rounded-2xl text-xs font-bold text-slate-400">
            <DollarSign size={16} className="text-slate-500" />
            Read-only view. To record payments go to <span className="text-[#F15D38] mx-1">Shipments</span> or <span className="text-[#F15D38] ml-1">Quotations</span>.
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#F15D38] transition-colors" size={20} />
            <input type="text" placeholder="Search by customer name…" className="search-input !pl-12 w-full" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>

          <div className="shipment-card !p-0 overflow-hidden border border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-900/40 border-b border-slate-800">
                    {['Invoice #','Customer','Date','Status','Total','Balance Due','Receipt',''].map(h => (
                      <th key={h} className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {invoices.filter(inv => inv.customer.toLowerCase().includes(searchTerm.toLowerCase())).map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-800/20 transition-all">
                      <td className="px-6 py-5 font-mono text-sm font-black text-[#F15D38]">{inv.id}</td>
                      <td className="px-6 py-5">
                        <p className="font-bold text-slate-100">{inv.customer}</p>
                        {inv.paymentMethod && <p className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">{inv.paymentMethod}</p>}
                      </td>
                      <td className="px-6 py-5 text-xs font-bold text-slate-400">{inv.date}</td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-full ${
                          inv.status === 'PAID'    ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-800/20'
                          : inv.status === 'PARTIAL'? 'bg-amber-950/30 text-amber-400 border border-amber-800/20'
                          :                           'bg-rose-950/30 text-rose-400 border border-rose-800/20'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${inv.status === 'PAID' ? 'bg-emerald-500' : inv.status === 'PARTIAL' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 font-black text-slate-100">{money(inv.amount)}</td>
                      <td className="px-6 py-5">
                        {inv.status === 'PAID'
                          ? <span className="text-[10px] font-black text-emerald-400">Settled</span>
                          : <span className="font-black text-rose-400">{money(inv.balanceDue ?? inv.amount)}</span>}
                      </td>
                      <td className="px-6 py-5">
                        {inv.mongoId && (
                          <a href={`/api/invoices/${inv.mongoId}/pdf`} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[10px] font-black uppercase transition-all" title="Open PDF">
                            <Download size={13} /> PDF
                          </a>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        {inv.mongoId && (
                          <button
                            onClick={() => handleDeleteInvoice(inv.mongoId!, inv.id)}
                            className="p-2 hover:bg-rose-950/30 text-slate-600 hover:text-rose-400 rounded-lg transition-colors"
                            title="Delete invoice"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {invoices.length === 0 && <tr><td colSpan={8} className="px-6 py-12 text-center text-xs font-bold text-slate-500">No invoices found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── CHART OF ACCOUNTS ── */}
      {activeTab === 'accounts' && (
        <div className="space-y-8 animate-in zoom-in-95 duration-300">
          <div className={`shipment-card border ${freightAllTime - expensesAllTime >= 0 ? 'border-emerald-800/30 bg-emerald-950/10' : 'border-rose-800/30 bg-rose-950/10'}`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">All-Time Net Position</p>
                <p className={`text-4xl font-black mt-1 ${freightAllTime - expensesAllTime >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{money(freightAllTime - expensesAllTime)}</p>
                <p className="text-xs font-bold text-slate-500 mt-1">Revenue {money(freightAllTime)} − Expenses {money(expensesAllTime)}</p>
              </div>
              <div className="flex gap-8">
                <div className="text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Receivable</p>
                  <p className="text-xl font-black text-amber-400 mt-1">{money(totalReceivables)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Payable</p>
                  <p className="text-xl font-black text-rose-400 mt-1">{money(totalPayables)}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {chartOfAccounts.map(account => (
              <div key={account.name} className="shipment-card border border-slate-800 bg-[#131B2E]">
                <div className="mb-4">
                  <span className={`text-[10px] font-black px-2 py-1 rounded ${
                    account.type === 'Asset'     ? 'bg-[#F15D38]/10 text-[#F15D38] border border-[#F15D38]/20'
                    : account.type === 'Liability'? 'bg-rose-950/30 text-rose-400 border border-rose-800/20'
                    : account.type === 'Income'   ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-800/20'
                    :                               'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}>{account.type.toUpperCase()}</span>
                </div>
                <h4 className="text-sm font-black text-slate-100 mb-1">{account.name}</h4>
                <p className="text-2xl font-black text-slate-100">${account.balance.toLocaleString()}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-4">Active Balance</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── AR AGING ── */}
      {activeTab === 'ar-aging' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div>
            <h2 className="text-xl font-black text-slate-100">Accounts Receivable Aging</h2>
            <p className="text-slate-400 text-sm mt-1">Every customer who owes you money, grouped by how long they have owed it. Focus on red buckets first.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Current',    data: arAgingData.totals.current, color: 'text-emerald-400', bg: 'bg-emerald-950/20 border-emerald-800/20' },
              { label: '1–30 Days',  data: arAgingData.totals.b1_30,   color: 'text-amber-400',   bg: 'bg-amber-950/20 border-amber-800/20' },
              { label: '31–60 Days', data: arAgingData.totals.b31_60,  color: 'text-orange-400',  bg: 'bg-orange-950/20 border-orange-800/20' },
              { label: '61–90 Days', data: arAgingData.totals.b61_90,  color: 'text-rose-400',    bg: 'bg-rose-950/20 border-rose-800/20' },
              { label: '90+ Days',   data: arAgingData.totals.b90plus, color: 'text-red-400',     bg: 'bg-red-950/30 border-red-800/30' },
            ].map(bucket => (
              <div key={bucket.label} className={`shipment-card border ${bucket.bg} py-5`}>
                <p className={`text-[10px] font-black uppercase tracking-widest ${bucket.color}`}>{bucket.label}</p>
                <p className="text-xl font-black text-slate-100 mt-2">{money(bucket.data.amount)}</p>
                <p className="text-[10px] font-bold text-slate-500 mt-1">{bucket.data.count} inv.</p>
              </div>
            ))}
          </div>
          {arAgingData.rows.length === 0 ? (
            <div className="shipment-card border border-slate-800 text-center py-16">
              <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-4" />
              <p className="text-lg font-black text-slate-100">All invoices are paid!</p>
              <p className="text-sm text-slate-400 mt-2">No outstanding receivables.</p>
            </div>
          ) : (
            <div className="shipment-card !p-0 overflow-hidden border border-slate-800">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-900/40 border-b border-slate-800">
                      {['Customer','Invoice #','Total','Balance Due','Due Date','Days','Bucket'].map(h => (
                        <th key={h} className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {arAgingData.rows.map(row => (
                      <tr key={row.id} className="hover:bg-slate-800/20 transition-all">
                        <td className="px-6 py-5 font-bold text-slate-100">{row.customer}</td>
                        <td className="px-6 py-5 font-mono text-sm font-black text-[#F15D38]">{row.id}</td>
                        <td className="px-6 py-5 font-bold text-slate-300">{money(row.amount)}</td>
                        <td className="px-6 py-5 font-black text-slate-100">{money(row.balanceDue ?? row.amount)}</td>
                        <td className="px-6 py-5 text-xs font-bold text-slate-400">{row.due || '—'}</td>
                        <td className="px-6 py-5"><span className={`font-black text-sm ${row.days <= 0 ? 'text-emerald-400' : row.days <= 30 ? 'text-amber-400' : row.days <= 60 ? 'text-orange-400' : 'text-rose-400'}`}>{row.days <= 0 ? 'On time' : `${row.days}d`}</span></td>
                        <td className="px-6 py-5"><span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-full border ${row.bucket.bg} ${row.bucket.color} ${row.bucket.border}`}>{row.bucket.label}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── AP AGING ── */}
      {activeTab === 'ap-aging' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div>
            <h2 className="text-xl font-black text-slate-100">Accounts Payable Aging</h2>
            <p className="text-slate-400 text-sm mt-1">Every vendor bill you still owe, grouped by how long overdue. Pay the red buckets first.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Current',    data: apAgingData.totals.current, color: 'text-emerald-400', bg: 'bg-emerald-950/20 border-emerald-800/20' },
              { label: '1–30 Days',  data: apAgingData.totals.b1_30,   color: 'text-amber-400',   bg: 'bg-amber-950/20 border-amber-800/20' },
              { label: '31–60 Days', data: apAgingData.totals.b31_60,  color: 'text-orange-400',  bg: 'bg-orange-950/20 border-orange-800/20' },
              { label: '61–90 Days', data: apAgingData.totals.b61_90,  color: 'text-rose-400',    bg: 'bg-rose-950/20 border-rose-800/20' },
              { label: '90+ Days',   data: apAgingData.totals.b90plus, color: 'text-red-400',     bg: 'bg-red-950/30 border-red-800/30' },
            ].map(bucket => (
              <div key={bucket.label} className={`shipment-card border ${bucket.bg} py-5`}>
                <p className={`text-[10px] font-black uppercase tracking-widest ${bucket.color}`}>{bucket.label}</p>
                <p className="text-xl font-black text-slate-100 mt-2">{money(bucket.data.amount)}</p>
                <p className="text-[10px] font-bold text-slate-500 mt-1">{bucket.data.count} bill{bucket.data.count !== 1 ? 's' : ''}</p>
              </div>
            ))}
          </div>
          {apAgingData.rows.length === 0 ? (
            <div className="shipment-card border border-slate-800 text-center py-16">
              <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-4" />
              <p className="text-lg font-black text-slate-100">All bills are paid!</p>
              <p className="text-sm text-slate-400 mt-2">No outstanding payables.</p>
            </div>
          ) : (
            <div className="shipment-card !p-0 overflow-hidden border border-slate-800">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-900/40 border-b border-slate-800">
                      {['Vendor','Category','Amount','Due Date','Days','Bucket'].map(h => (
                        <th key={h} className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {apAgingData.rows.map(row => (
                      <tr key={row.id} className="hover:bg-slate-800/20 transition-all">
                        <td className="px-6 py-5 font-bold text-slate-100">{row.vendor}</td>
                        <td className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">{row.category}</td>
                        <td className="px-6 py-5 font-black text-slate-100">{money(row.amount)}</td>
                        <td className="px-6 py-5 text-xs font-bold text-slate-400">{row.due || '—'}</td>
                        <td className="px-6 py-5">
                          <span className={`font-black text-sm ${row.days <= 0 ? 'text-emerald-400' : row.days <= 30 ? 'text-amber-400' : row.days <= 60 ? 'text-orange-400' : 'text-rose-400'}`}>
                            {row.days <= 0 ? 'On time' : `${row.days}d`}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-full border ${row.bucket.bg} ${row.bucket.color} ${row.bucket.border}`}>
                            {row.bucket.label}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CREDIT LIMITS ── */}
      {activeTab === 'credit-limits' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div>
            <h2 className="text-xl font-black text-slate-100">Customer Credit Limits</h2>
            <p className="text-slate-400 text-sm mt-1">Set a credit limit per customer. Click any limit cell to edit it. Customers over 80% are flagged amber, over 100% are red.</p>
          </div>
          <div className="shipment-card !p-0 overflow-hidden border border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-900/40 border-b border-slate-800">
                    {['Customer','Outstanding Balance','Credit Limit','Utilization','Status'].map(h => (
                      <th key={h} className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {creditData.map(c => {
                    const isEditing   = editingCreditId === c._id;
                    const isOverLimit = c.utilPct !== null && c.utilPct >= 100;
                    const isNearLimit = c.utilPct !== null && c.utilPct >= 80 && c.utilPct < 100;
                    return (
                      <tr key={c._id} className={`hover:bg-slate-800/20 transition-all ${isOverLimit ? 'border-l-2 border-rose-500/50' : ''}`}>
                        <td className="px-6 py-5">
                          <p className="font-bold text-slate-100">{c.name}</p>
                          <p className="text-[10px] font-bold text-slate-500">{c.phone}</p>
                        </td>
                        <td className="px-6 py-5 font-black text-slate-100">{money(c.outstanding)}</td>
                        <td className="px-6 py-5">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400 font-bold text-sm">$</span>
                              <input
                                type="number"
                                className="w-28 bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-100 focus:outline-none focus:border-[#F15D38]"
                                value={creditInputVal}
                                onChange={e => setCreditInputVal(e.target.value)}
                                onKeyDown={async e => {
                                  if (e.key === 'Enter') {
                                    await fetch(`/api/customers?id=${c._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ creditLimit: Number(creditInputVal) }) });
                                    await loadCustomers();
                                    setEditingCreditId(null);
                                  }
                                  if (e.key === 'Escape') setEditingCreditId(null);
                                }}
                                autoFocus
                              />
                              <button
                                onClick={async () => {
                                  await fetch(`/api/customers?id=${c._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ creditLimit: Number(creditInputVal) }) });
                                  await loadCustomers();
                                  setEditingCreditId(null);
                                }}
                                className="text-[10px] font-black px-3 py-1.5 bg-[#F15D38] text-white rounded-lg hover:bg-[#d94f2e] transition-colors"
                              >Save</button>
                              <button onClick={() => setEditingCreditId(null)} className="text-[10px] font-black px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors">Cancel</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setEditingCreditId(c._id); setCreditInputVal(String(c.creditLimit ?? 0)); }}
                              className="font-black text-slate-100 hover:text-[#F15D38] transition-colors text-left group flex items-center gap-2"
                              title="Click to edit"
                            >
                              {c.creditLimit ? money(c.creditLimit) : <span className="text-slate-500 font-bold text-xs">Set limit</span>}
                              <span className="text-[10px] text-slate-600 group-hover:text-[#F15D38] transition-colors">✎</span>
                            </button>
                          )}
                        </td>
                        <td className="px-6 py-5 w-48">
                          {c.utilPct !== null ? (
                            <div>
                              <div className="mb-1.5">
                                <span className={`text-xs font-black ${isOverLimit ? 'text-rose-400' : isNearLimit ? 'text-amber-400' : 'text-emerald-400'}`}>{c.utilPct.toFixed(0)}%</span>
                              </div>
                              <div className="h-2 bg-slate-800 rounded-full overflow-hidden w-36">
                                <div className={`h-full rounded-full transition-all ${isOverLimit ? 'bg-rose-500' : isNearLimit ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${Math.min(c.utilPct, 100)}%` }} />
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-500">No limit set</span>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-full border ${
                            isOverLimit  ? 'bg-rose-950/30 text-rose-400 border-rose-800/20'
                            : isNearLimit ? 'bg-amber-950/30 text-amber-400 border-amber-800/20'
                            : c.outstanding === 0 ? 'bg-emerald-950/30 text-emerald-400 border-emerald-800/20'
                            :                       'bg-slate-900 text-slate-400 border-slate-800'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${isOverLimit ? 'bg-rose-500' : isNearLimit ? 'bg-amber-400' : c.outstanding === 0 ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                            {isOverLimit ? 'OVER LIMIT' : isNearLimit ? 'NEAR LIMIT' : c.outstanding === 0 ? 'CLEAR' : 'OK'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {creditData.length === 0 && (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-xs font-bold text-slate-500">No customers found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── P&L STATEMENT ── */}
      {activeTab === 'pl-statement' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-100">Profit &amp; Loss Statement</h2>
              <p className="text-slate-400 text-sm mt-1">Revenue vs expenses for the selected period.</p>
            </div>
            <div className="flex gap-1 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
              {(Object.keys(PL_PERIOD_LABELS) as PLPeriod[]).map(val => (
                <button key={val} onClick={() => setPlPeriod(val)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${plPeriod === val ? 'bg-[#F15D38] text-white' : 'text-slate-400 hover:text-slate-200'}`}>
                  {PL_PERIOD_LABELS[val]}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 shipment-card border border-slate-800 bg-[#131B2E]">
              <div className="border-b border-slate-700 pb-6 mb-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Q Cargo Logistics</p>
                <h3 className="text-lg font-black text-slate-100 mt-1">Profit &amp; Loss Statement</h3>
                <p className="text-xs font-bold text-slate-500 mt-1">Period: {PL_PERIOD_LABELS[plPeriod]} · {plData.shipmentCount} shipments</p>
              </div>
              <div className="mb-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Income</p>
                <div className="flex justify-between py-3 border-b border-slate-800/50"><span className="text-sm font-bold text-slate-300">Freight Revenue (Shipments)</span><span className="font-black text-slate-100">{money(plData.totalRevenue)}</span></div>
                <div className="flex justify-between py-3 border-b border-slate-800/50"><span className="text-sm font-bold text-slate-300">Cash Collected (Invoices)</span><span className="font-black text-emerald-400">{money(plData.cashCollected)}</span></div>
                <div className="flex justify-between py-3 bg-slate-900/40 px-4 rounded-xl mt-3"><span className="text-sm font-black text-slate-100 uppercase">Total Revenue</span><span className="font-black text-xl text-slate-100">{money(plData.totalRevenue)}</span></div>
              </div>
              <div className="mb-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Operating Expenses</p>
                {plData.categoryBreakdown.length === 0
                  ? <p className="text-xs font-bold text-slate-500 py-4">No expenses for this period.</p>
                  : plData.categoryBreakdown.map(cat => (
                    <div key={cat.category} className="flex justify-between py-3 border-b border-slate-800/50">
                      <span className="text-sm font-bold text-slate-300">{cat.category}</span>
                      <span className="font-black text-slate-400">({money(cat.amount)})</span>
                    </div>
                  ))}
                <div className="flex justify-between py-3 bg-slate-900/40 px-4 rounded-xl mt-3"><span className="text-sm font-black text-slate-100 uppercase">Total Expenses</span><span className="font-black text-xl text-rose-400">({money(plData.totalExpenses)})</span></div>
              </div>
              <div className={`flex justify-between items-center py-5 px-6 rounded-2xl border-2 ${plData.grossProfit >= 0 ? 'border-emerald-700/40 bg-emerald-950/20' : 'border-rose-700/40 bg-rose-950/20'}`}>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Net Profit</p>
                  {plData.marginPercent != null && <p className="text-[10px] font-bold text-slate-500 mt-0.5">{plData.marginPercent.toFixed(1)}% margin</p>}
                </div>
                <span className={`text-3xl font-black ${plData.grossProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{money(plData.grossProfit)}</span>
              </div>
            </div>
            <div className="shipment-card border border-slate-800 bg-[#131B2E]">
              <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest mb-6">Expense Breakdown</h3>
              {plData.categoryBreakdown.length === 0
                ? <p className="text-xs font-bold text-slate-500 text-center py-10">No expenses this period</p>
                : <div className="space-y-5">{plData.categoryBreakdown.map(cat => {
                    const pct = plData.totalExpenses > 0 ? (cat.amount / plData.totalExpenses) * 100 : 0;
                    return (
                      <div key={cat.category}>
                        <div className="flex justify-between mb-1.5"><span className="text-xs font-bold text-slate-300 truncate pr-2">{cat.category}</span><span className="text-xs font-black text-slate-400">{pct.toFixed(0)}%</span></div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-[#F15D38] rounded-full" style={{ width: `${pct}%` }} /></div>
                        <p className="text-[10px] font-bold text-slate-500 mt-1">{money(cat.amount)}</p>
                      </div>
                    );
                  })}</div>}
            </div>
          </div>
        </div>
      )}

      {/* ── CASH FLOW ── */}
      {activeTab === 'cashflow' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div>
            <h2 className="text-xl font-black text-slate-100">Cash Flow</h2>
            <p className="text-slate-400 text-sm mt-1">Money coming in from customers vs going out to vendors — last 6 months.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Cash In (6 months)',  value: money(cashFlowChart.totalIn),  color: 'text-emerald-400', bg: 'bg-emerald-950/20 border-emerald-800/20', desc: 'Collected from customers' },
              { label: 'Cash Out (6 months)', value: money(cashFlowChart.totalOut), color: 'text-rose-400',    bg: 'bg-rose-950/20 border-rose-800/20',       desc: 'Paid to vendors' },
              { label: 'Net Cash',            value: money(cashFlowChart.net),      color: cashFlowChart.net >= 0 ? 'text-sky-400' : 'text-rose-400', bg: cashFlowChart.net >= 0 ? 'bg-sky-950/20 border-sky-800/20' : 'bg-rose-950/20 border-rose-800/20', desc: cashFlowChart.net >= 0 ? 'Positive cash flow' : 'Negative — review expenses' },
            ].map(s => (
              <div key={s.label} className={`shipment-card border ${s.bg}`}>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                <p className={`text-3xl font-black mt-2 ${s.color}`}>{s.value}</p>
                <p className="text-[10px] font-bold text-slate-500 mt-1">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="shipment-card border border-slate-800 bg-[#131B2E]">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest">Monthly Cash Flow</h3>
              <div className="flex gap-5 text-[10px] font-black text-slate-400">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />Cash In</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-rose-500 inline-block" />Cash Out</span>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashFlowChart.points} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#131B2E', borderRadius: '16px', border: '1px solid #1e293b' }} labelStyle={{ color: '#f1f5f9', fontWeight: 'bold' }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(val: any) => [`$${Number(val).toLocaleString()}`, '']} />
                  <Bar dataKey="Cash In"  fill="#10b981" radius={[4,4,0,0]} />
                  <Bar dataKey="Cash Out" fill="#f43f5e" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="shipment-card !p-0 overflow-hidden border border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-900/40 border-b border-slate-800">
                    {['Month','Cash In','Cash Out','Net'].map(h => <th key={h} className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {cashFlowChart.points.map(row => {
                    const net = row['Cash In'] - row['Cash Out'];
                    return (
                      <tr key={row.name} className="hover:bg-slate-800/20 transition-all">
                        <td className="px-6 py-5 font-bold text-slate-200">{row.name}</td>
                        <td className="px-6 py-5 font-black text-emerald-400">{money(row['Cash In'])}</td>
                        <td className="px-6 py-5 font-black text-rose-400">{money(row['Cash Out'])}</td>
                        <td className={`px-6 py-5 font-black ${net >= 0 ? 'text-sky-400' : 'text-rose-400'}`}>{money(net)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── BALANCE SHEET ── */}
      {activeTab === 'balance-sheet' && (
        <BalanceSheetTab
          openingBalance={settings?.openingCashBalance ?? 0}
          cashIn={lifetimeCashIn}
          cashOut={lifetimeCashOut}
          receivables={totalReceivables}
          payables={totalPayables}
        />
      )}

      {/* ── BUDGET vs ACTUAL ── */}
      {activeTab === 'budget' && (
        <BudgetTab bills={bills.map(b => ({ category: b.category, amount: b.amount, date: b.date }))} />
      )}

      {/* ── TAX ── */}
      {activeTab === 'tax' && (
        <TaxTab
          shipments={shipments.map(s => ({ date: s.date, total: s.total }))}
          settings={settings}
          onGoSetup={() => setActiveTab('setup')}
        />
      )}

      {/* ── BANK RECONCILIATION ── */}
      {activeTab === 'bank-rec' && <BankRecTab />}

      {/* ── SETUP ── */}
      {activeTab === 'setup' && <SetupTab settings={settings} onSaved={loadSettings} />}
    </div>
  );
}
