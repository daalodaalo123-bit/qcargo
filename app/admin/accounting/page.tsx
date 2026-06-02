'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight,
  Search,
  Filter,
  Plus,
  MoreVertical,
  ChevronRight,
  Download,
  Calendar,
  Wallet,
  Building2,
  PieChart,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  User,
  X,
  Pencil,
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import ExpenseFinancialIntel, {
  type IntelExpense,
  type IntelShipment,
} from '@/app/admin/expenses/ExpenseFinancialIntel';
import EditBillModal from '@/app/admin/accounting/EditBillModal';
import {
  computeLiveOverview,
  buildMonthlyFreightChart,
  buildChartOfAccountsLive,
} from '@/lib/accounting-summary';

type TabType = 'overview' | 'invoices' | 'bills' | 'accounts' | 'reports';

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

const DEFAULT_INVOICES: Invoice[] = [
  { id: 'INV-1001', customer: 'Ahmed Ali', date: '2026-05-20', due: '2026-06-20', amount: 4500.00, status: 'PAID' },
  { id: 'INV-1002', customer: 'Sahra Hassan', date: '2026-05-18', due: '2026-06-18', amount: 1250.00, status: 'PARTIAL' },
  { id: 'INV-1003', customer: 'Mohamed Ibrahim', date: '2026-05-15', due: '2026-06-15', amount: 3200.00, status: 'UNPAID' },
];

const DEFAULT_BILLS: Bill[] = [
  { id: 'BIL-901', vendor: 'Berbera Harbor Port', date: '2026-05-15', due: '2026-06-10', amount: 1200.00, status: 'PAID', category: 'Port Taxes' },
  { id: 'BIL-902', vendor: 'Air Cargo Aviation Fuel', date: '2026-05-18', due: '2026-06-01', amount: 4500.00, status: 'PENDING', category: 'Fuel Freight' },
  { id: 'BIL-903', vendor: 'Hargeisa Local Dispatch', date: '2026-05-25', due: '2026-06-05', amount: 850.00, status: 'PENDING', category: 'Trucking' },
];

export default function AccountingPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [shipments, setShipments] = useState<IntelShipment[]>([]);
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  
  // Bill Creation Form State
  const [isAddingBill, setIsAddingBill] = useState(false);
  const [billVendor, setBillVendor] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billCategory, setBillCategory] = useState('Port Taxes');
  const [billDueDate, setBillDueDate] = useState('');
  const [billStatus, setBillStatus] = useState<'PENDING' | 'PAID'>('PENDING');
  const [billPaymentMethod, setBillPaymentMethod] = useState('ZAAD');
  const [editingBill, setEditingBill] = useState<Bill | null>(null);

  // Load bills from MongoDB
  const loadBills = async () => {
    try {
      const res = await fetch('/api/bills');
      if (!res.ok) throw new Error('Failed to fetch bills');
      const data = await res.json();
      setBills(
        data.map((b: Record<string, unknown>) => ({
          id: String(b._id || b.id),
          vendor: String(b.vendor || ''),
          date: String(b.date || ''),
          due: String(b.due || ''),
          amount: Number(b.amount) || 0,
          status: (b.status as Bill['status']) || 'PENDING',
          category: String(b.category || 'General'),
          paymentMethod: String(b.paymentMethod || 'CASH'),
          batchId: String(b.batchId || 'GENERAL'),
        }))
      );
    } catch (e) {
      console.error('Error loading bills:', e);
    }
  };

  // Load customer invoices from accounting API (quotation payments + receipts)
  const loadInvoices = async () => {
    try {
      const res = await fetch('/api/invoices');
      if (!res.ok) throw new Error('Failed to fetch invoices');
      const data = await res.json();
      const mapped = data.map((inv: {
        _id: string;
        invoiceNumber: string;
        customerName: string;
        paymentDate: string;
        totalAmount: number;
        amountPaid?: number;
        balanceDue?: number;
        paymentStatus: string;
        paymentMethod?: string;
        receiptPdfUrl?: string;
        createdAt?: string;
      }) => ({
        id: inv.invoiceNumber,
        mongoId: inv._id,
        customer: inv.customerName,
        date: inv.paymentDate || inv.createdAt?.split('T')[0] || '',
        due: inv.paymentDate || '',
        amount: inv.totalAmount || 0,
        status: inv.paymentStatus === 'PAID' ? 'PAID' as const : inv.paymentStatus === 'PARTIAL' ? 'PARTIAL' as const : 'UNPAID' as const,
        paymentMethod: inv.paymentMethod,
        amountPaidThisReceipt: inv.amountPaid,
        balanceDue: inv.balanceDue,
        receiptPdfUrl: inv.receiptPdfUrl,
      }));
      setInvoices(mapped.length > 0 ? mapped : []);
    } catch (e) {
      console.error('Error loading invoices:', e);
      setInvoices(DEFAULT_INVOICES);
    }
  };

  const loadShipments = async () => {
    try {
      const res = await fetch('/api/shipments');
      if (!res.ok) throw new Error('Failed to load shipments');
      const data = await res.json();
      setShipments(
        data.map((s: Record<string, unknown>) => ({
          id: String(s._id || s.id),
          date: String(s.date || ''),
          total: Number(s.total) || 0,
          type: String(s.type || 'AIR'),
          weight: Number(s.weight) || 0,
          cbm: Number(s.cbm) || 0,
          batch: String(s.batch || 'UNASSIGNED'),
        }))
      );
    } catch (e) {
      console.error(e);
      setShipments([]);
    }
  };

  useEffect(() => {
    loadBills();
    loadInvoices();
    loadShipments();
  }, []);

  const intelExpenses: IntelExpense[] = bills.map((b) => ({
    id: b.id,
    batchId: b.batchId || 'GENERAL',
    category: b.category,
    vendor: b.vendor,
    amount: b.amount,
    date: b.date,
    status: b.status === 'PAID' ? 'PAID' : 'PENDING',
    paymentMethod: b.paymentMethod || 'CASH',
  }));

  const expenseRows = useMemo(
    () =>
      bills.map((b) => ({
        amount: b.amount,
        date: b.date,
        batchId: b.batchId,
        status: b.status,
        category: b.category,
        vendor: b.vendor,
      })),
    [bills]
  );

  const invoiceRows = useMemo(
    () =>
      invoices.map((inv) => ({
        date: inv.date,
        amount: inv.amount,
        status: inv.status,
        amountPaid: inv.amountPaidThisReceipt,
      })),
    [invoices]
  );

  const totalReceivables = invoices
    .filter((inv) => inv.status !== 'PAID')
    .reduce((acc, inv) => acc + (inv.balanceDue ?? inv.amount), 0);

  const totalPayables = bills
    .filter((b) => b.status === 'PENDING')
    .reduce((acc, b) => acc + b.amount, 0);

  const liveMonth = useMemo(
    () =>
      computeLiveOverview(
        shipments,
        invoiceRows,
        expenseRows,
        totalReceivables,
        totalPayables,
        'this_month'
      ),
    [shipments, invoiceRows, expenseRows, totalReceivables, totalPayables]
  );

  const revenueChart = useMemo(() => buildMonthlyFreightChart(shipments), [shipments]);

  const freightAllTime = useMemo(
    () => shipments.reduce((s, sh) => s + sh.total, 0),
    [shipments]
  );
  const expensesAllTime = useMemo(
    () => bills.reduce((s, b) => s + b.amount, 0),
    [bills]
  );

  const chartOfAccounts = useMemo(
    () =>
      buildChartOfAccountsLive(
        freightAllTime,
        expensesAllTime,
        totalReceivables,
        totalPayables
      ),
    [freightAllTime, expensesAllTime, totalReceivables, totalPayables]
  );

  const money = (n: number) =>
    `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleFiscalExport = () => {
    let rows: string[][];
    let filename: string;

    if (activeTab === 'invoices') {
      rows = [
        ['Invoice #', 'Customer', 'Date', 'Due', 'Amount ($)', 'Status', 'Payment Method'],
        ...invoices.map((inv) => [
          inv.id,
          inv.customer,
          inv.date,
          inv.due,
          String(inv.amount),
          inv.status,
          inv.paymentMethod || '',
        ]),
      ];
      filename = `qcargo_invoices_${new Date().toISOString().slice(0, 10)}.csv`;
    } else if (activeTab === 'bills') {
      rows = [
        ['Vendor', 'Category', 'Amount ($)', 'Date', 'Due', 'Status', 'Payment Method', 'Batch'],
        ...bills.map((b) => [
          b.vendor,
          b.category,
          String(b.amount),
          b.date,
          b.due,
          b.status,
          b.paymentMethod || '',
          b.batchId || '',
        ]),
      ];
      filename = `qcargo_bills_${new Date().toISOString().slice(0, 10)}.csv`;
    } else {
      rows = [
        ['Section', 'Metric', 'Value'],
        ['This month', 'Freight revenue', String(liveMonth.freightRevenue)],
        ['This month', 'Cash collected (invoices)', String(liveMonth.cashCollected)],
        ['This month', 'Expenses', String(liveMonth.expenses)],
        ['This month', 'Net profit', String(liveMonth.netProfit)],
        ['This month', 'Net margin %', liveMonth.netMarginPercent?.toFixed(1) ?? ''],
        ['All time', 'Outstanding invoices', String(totalReceivables)],
        ['All time', 'Unpaid bills', String(totalPayables)],
        [],
        ['--- INVOICES ---'],
        ['Invoice #', 'Customer', 'Date', 'Amount ($)', 'Status'],
        ...invoices.map((inv) => [inv.id, inv.customer, inv.date, String(inv.amount), inv.status]),
        [],
        ['--- VENDOR BILLS ---'],
        ['Vendor', 'Category', 'Amount ($)', 'Date', 'Status', 'Batch'],
        ...bills.map((b) => [b.vendor, b.category, String(b.amount), b.date, b.status, b.batchId || '']),
        [],
        ['--- SHIPMENTS ---'],
        ['ID', 'Batch', 'Total ($)', 'Type', 'Date'],
        ...shipments.map((s) => [s.id || '', s.batch || '', String(s.total), s.type || '', s.date]),
      ];
      filename = `qcargo_accounting_${new Date().toISOString().slice(0, 10)}.csv`;
    }
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    link.download = filename;
    link.click();
  };



  const handleAddBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billVendor.trim() || !billAmount) {
      alert('Please fill out vendor and amount');
      return;
    }
    if (!billCategory.trim()) {
      alert('Please enter or select a category');
      return;
    }

    const newBill = {
      vendor: billVendor,
      date: new Date().toISOString().split('T')[0],
      due: billDueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      amount: parseFloat(billAmount) || 0,
      status: billStatus,
      category: billCategory.trim(),
      paymentMethod: billPaymentMethod,
    };

    try {
      const res = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBill),
      });
      if (!res.ok) throw new Error('Failed to save bill');
      const saved = await res.json();
      setBills(prev => [{ ...saved, id: saved._id || saved.id }, ...prev]);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }

    // Reset fields
    setBillVendor('');
    setBillAmount('');
    setBillCategory('Port Taxes');
    setBillPaymentMethod('ZAAD');
    setBillDueDate('');
    setBillStatus('PENDING');
    setIsAddingBill(false);
  };

  const handleDeleteBill = async (id: string) => {
    if (confirm('Delete this vendor bill?')) {
      try {
        const res = await fetch(`/api/bills?id=${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete bill');
        setBills(prev => prev.filter(b => b.id !== id));
      } catch (err: any) {
        alert(`Error: ${err.message}`);
      }
    }
  };

  const handleSettleBill = async (id: string) => {
    try {
      const res = await fetch(`/api/bills?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PAID' }),
      });
      if (!res.ok) throw new Error('Failed to settle bill');
      setBills(prev => prev.map(b => b.id === id ? { ...b, status: 'PAID' as const } : b));
      alert('Bill marked as fully PAID!');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDeleteInvoice = async (inv: Invoice) => {
    if (confirm('Delete this invoice record?')) {
      try {
        const deleteId = inv.mongoId || inv.id;
        const res = await fetch(`/api/invoices?id=${deleteId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete');
        setInvoices(prev => prev.filter(i => i.id !== inv.id));
        alert('Invoice deleted.');
      } catch (err: unknown) {
        alert(`Error: ${err instanceof Error ? err.message : 'Failed'}`);
      }
    }
  };

  const handleSettleInvoice = async (id: string) => {
    // Mark the underlying shipment as PAID via a direct state update (no dedicated PATCH endpoint yet)
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: 'PAID' as const } : inv));
    alert('Invoice marked as PAID!');
  };

  return (
    <div className="admin-container pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight">Financial Command Ledger</h1>
          <p className="text-slate-400 font-medium font-sans">Global commissions, invoices, and operations bills</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={handleFiscalExport}
            className="flex-1 md:flex-none btn bg-white border border-slate-800 text-slate-300 flex items-center justify-center gap-2 hover:bg-slate-800 shadow-sm"
          >
            <Download size={18} />
            Export CSV
          </button>
          {activeTab === 'bills' ? (
            <button 
              onClick={() => setIsAddingBill(!isAddingBill)} 
              className="flex-1 md:flex-none btn btn-primary flex items-center justify-center gap-2 shadow-lg shadow-[#F15D38]/20"
            >
              <Plus size={18} />
              Add Vendor Bill
            </button>
          ) : (
            <button 
              onClick={() => {
                setActiveTab('bills');
                setIsAddingBill(true);
              }} 
              className="flex-1 md:flex-none btn btn-primary flex items-center justify-center gap-2 shadow-lg shadow-[#F15D38]/20"
            >
              <Plus size={18} />
              Add Vendor Bill
            </button>
          )}
        </div>
      </div>

      <ExpenseFinancialIntel
        expenses={intelExpenses}
        shipments={shipments}
        showNetMargin
        showAccountingExtras
        hideExpenseTable
        description="This month: spend, freight, net margin, and efficiency. Tabs below for invoices and bills."
      />

      {editingBill && (
        <EditBillModal
          bill={editingBill}
          onClose={() => setEditingBill(null)}
          onSaved={(updated) => {
            setBills((prev) => prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b)));
          }}
        />
      )}

      {/* Tabs Menu */}
      <div className="flex gap-1 p-1 bg-slate-900 border border-slate-800 rounded-[1.5rem] w-fit mb-10 overflow-x-auto max-w-full">
        {[
          { id: 'overview', name: 'Ledger Overview', icon: PieChart },
          { id: 'invoices', name: 'Customer Invoices', icon: DollarSign },
          { id: 'bills', name: 'Vendor Bills', icon: CreditCard },
          { id: 'accounts', name: 'Chart of Accounts', icon: Building2 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as TabType);
              setSearchTerm('');
            }}
            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-[#F15D38] text-white shadow-md' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <tab.icon size={14} />
            {tab.name}
          </button>
        ))}
      </div>

      {/* Render: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-10 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: 'Freight (this month)', value: money(liveMonth.freightRevenue), trend: 'Live', icon: TrendingUp, color: 'text-[#F15D38]', bg: 'bg-[#F15D38]/10 border border-[#F15D38]/20' },
              { label: 'Cash in (this month)', value: money(liveMonth.cashCollected), trend: 'Invoices', icon: DollarSign, color: 'text-sky-400', bg: 'bg-sky-950/20 border border-sky-800/20' },
              { label: 'Outstanding invoices', value: money(totalReceivables), trend: 'Due', icon: Wallet, color: 'text-amber-400', bg: 'bg-amber-950/20 border border-amber-800/20' },
              { label: 'Net profit (this month)', value: money(liveMonth.netProfit), trend: liveMonth.netMarginPercent != null ? `${liveMonth.netMarginPercent.toFixed(1)}% margin` : '—', icon: TrendingUp, color: liveMonth.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400', bg: 'bg-emerald-950/20 border border-emerald-800/20' },
            ].map((stat) => (
              <div key={stat.label} className={`shipment-card ${stat.bg}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-2xl ${stat.color}`}>
                    <stat.icon size={24} />
                  </div>
                  <span className={`text-[10px] font-black px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 ${stat.color}`}>
                    {stat.trend}
                  </span>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                <h3 className="text-2xl font-black text-slate-100 mt-1">{stat.value}</h3>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Area Chart */}
            <div className="lg:col-span-2 shipment-card border border-slate-800 bg-[#131B2E]">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest">Freight revenue (last 6 months)</h3>
                <span className="px-3 py-1 bg-slate-900 border border-slate-800 text-[10px] font-black uppercase rounded-lg text-[#F15D38]">From shipments</span>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueChart}>
                    <defs>
                      <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F15D38" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#F15D38" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#131B2E', borderRadius: '16px', border: '1px solid #1e293b' }}
                      labelStyle={{ color: '#f1f5f9', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#F15D38" strokeWidth={3} fillOpacity={1} fill="url(#colorCommission)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Payables Queue */}
            <div className="shipment-card border border-slate-800 bg-[#131B2E]">
              <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest mb-8">Urgent Payables Queue</h3>
              <div className="space-y-6">
                {bills.slice(0, 3).map((bill) => (
                  <div key={bill.id} className="flex justify-between items-center group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:border-[#F15D38]/40 group-hover:text-[#F15D38] transition-all">
                        <Building2 size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-200">{bill.vendor}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Due: {bill.due}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-100">${bill.amount.toLocaleString()}</p>
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${
                        bill.status === 'PAID' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
                      }`}>
                        {bill.status}
                      </span>
                    </div>
                  </div>
                ))}
                {bills.length === 0 && (
                  <p className="text-xs font-bold text-slate-500 text-center py-6">All bills settled!</p>
                )}
              </div>
              <button 
                onClick={async () => {
                  const pendingBills = bills.filter(b => b.status !== 'PAID');
                  if (pendingBills.length === 0) { alert('No pending bills to settle!'); return; }
                  for (const bill of pendingBills) {
                    try {
                      await fetch(`/api/bills?id=${bill.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'PAID' }),
                      });
                    } catch (e) { /* ignore individual failures */ }
                  }
                  setBills(prev => prev.map(b => ({ ...b, status: 'PAID' as const })));
                  alert('All vendor accounts fully balanced!');
                }}
                className="w-full mt-10 py-4 bg-slate-950 hover:bg-[#F15D38] border border-slate-800 hover:border-transparent text-slate-300 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Settle All Bills
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Render: VENDOR BILLS */}
      {activeTab === 'bills' && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
          
          {/* Add Bill Form Overlay */}
          {isAddingBill && (
            <form onSubmit={handleAddBill} className="shipment-card border border-slate-800 p-8 rounded-2xl bg-[#131B2E] animate-in slide-in-from-top-4 duration-300">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-base font-black text-slate-100 uppercase tracking-widest">Record Vendor Bill</h3>
                <button type="button" onClick={() => setIsAddingBill(false)} className="text-slate-400 hover:text-slate-200">
                  <X size={20} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Vendor Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Berbera Harbor Authority" 
                      className="search-input w-full !pl-10"
                      value={billVendor}
                      onChange={e => setBillVendor(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Amount in USD</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input 
                      type="number" 
                      required 
                      placeholder="0.00" 
                      className="search-input w-full !pl-10"
                      value={billAmount}
                      onChange={e => setBillAmount(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Operation Expense Category</label>
                  <div className="space-y-2">
                    <select
                      className="search-input w-full"
                      value={
                        ['Port Taxes', 'Freight Fuel', 'Truck Dispatch', 'Office Costs', 'Brokerage'].includes(
                          billCategory
                        )
                          ? billCategory
                          : ''
                      }
                      onChange={(e) => {
                        if (e.target.value) setBillCategory(e.target.value);
                      }}
                    >
                      <option value="">Quick pick preset…</option>
                      <option value="Port Taxes">Berbera Port Taxes / Fees</option>
                      <option value="Freight Fuel">Aviation Freight Fuel</option>
                      <option value="Truck Dispatch">Truck Loading & Dispatch</option>
                      <option value="Office Costs">Corporate Operations Costs</option>
                      <option value="Brokerage">Customs Brokerage Fees</option>
                    </select>
                    <input
                      type="text"
                      required
                      className="search-input w-full"
                      placeholder="Or type your own category"
                      value={billCategory}
                      onChange={(e) => setBillCategory(e.target.value)}
                      list="bill-category-suggestions"
                    />
                    <datalist id="bill-category-suggestions">
                      <option value="Port Taxes" />
                      <option value="Freight Fuel" />
                      <option value="Truck Dispatch" />
                      <option value="Office Costs" />
                      <option value="Brokerage" />
                    </datalist>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Due Date</label>
                  <input 
                    type="date" 
                    className="search-input w-full"
                    value={billDueDate}
                    onChange={e => setBillDueDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Payment method</label>
                  <select
                    className="search-input w-full"
                    value={billPaymentMethod}
                    onChange={(e) => setBillPaymentMethod(e.target.value)}
                  >
                    <option value="ZAAD">Zaad</option>
                    <option value="EDAHAB">E-Dahab</option>
                    <option value="WAAFI">Waafi</option>
                    <option value="CASH">Cash</option>
                    <option value="BANK">Bank Transfer</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Initial Bill Status</label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
                      <input 
                        type="radio" 
                        name="billStatus" 
                        checked={billStatus === 'PENDING'} 
                        onChange={() => setBillStatus('PENDING')} 
                        className="accent-[#F15D38]"
                      />
                      Awaiting Payment (Pending)
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
                      <input 
                        type="radio" 
                        name="billStatus" 
                        checked={billStatus === 'PAID'} 
                        onChange={() => setBillStatus('PAID')}
                        className="accent-[#F15D38]" 
                      />
                      Pre-Paid (Settled)
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t border-slate-800/40 pt-6">
                <button 
                  type="button" 
                  onClick={() => setIsAddingBill(false)} 
                  className="px-6 py-2 rounded-xl text-xs font-black uppercase text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Record Ledger Bill
                </button>
              </div>
            </form>
          )}

          {/* Search ledger */}
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#F15D38] transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search bills by vendor name or category..." 
              className="search-input !pl-12 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Bills Ledger Table */}
          <div className="shipment-card !p-0 overflow-hidden border border-slate-800 shadow-xl shadow-slate-950/20">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-900/40 border-b border-slate-800">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Bill Reference</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendor Name / category</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Issue Date</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Due Date</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ledger Status</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Commission Due</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {bills
                    .filter(b => b.vendor.toLowerCase().includes(searchTerm.toLowerCase()) || b.category.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((bill) => (
                      <tr key={bill.id} className="hover:bg-slate-800/30 transition-all group">
                        <td className="px-8 py-6 font-mono text-sm font-black text-[#F15D38]">{bill.id}</td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-100">{bill.vendor}</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">{bill.category}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-xs font-bold text-slate-400">{bill.date}</td>
                        <td className="px-8 py-6 text-xs font-bold text-slate-400">{bill.due}</td>
                        <td className="px-8 py-6">
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-full ${
                            bill.status === 'PAID' 
                              ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-800/20' 
                              : 'bg-amber-950/30 text-amber-400 border border-amber-800/20'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              bill.status === 'PAID' ? 'bg-emerald-500' : 'bg-amber-500'
                            }`} />
                            {bill.status}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right font-black text-slate-100">${bill.amount.toLocaleString()}</td>
                        <td className="px-8 py-6">
                          <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => setEditingBill(bill)}
                              className="p-2 hover:bg-slate-800 text-slate-400 hover:text-slate-100 rounded-lg transition-colors"
                              title="Edit bill"
                            >
                              <Pencil size={16} />
                            </button>
                            {bill.status !== 'PAID' && (
                              <button 
                                onClick={() => handleSettleBill(bill.id)}
                                className="p-2 hover:bg-emerald-950/30 text-slate-400 hover:text-emerald-400 rounded-lg transition-colors" 
                                title="Settle/Pay Bill"
                              >
                                <Wallet size={16} />
                              </button>
                            )}
                            <button 
                              onClick={() => handleDeleteBill(bill.id)}
                              className="p-2 hover:bg-rose-950/30 text-slate-400 hover:text-rose-500 rounded-lg transition-colors" 
                              title="Delete bill"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  {bills.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-8 py-10 text-center text-xs font-bold text-slate-500">No vendor bills recorded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Render: CUSTOMER INVOICES */}
      {activeTab === 'invoices' && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#F15D38] transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search invoices by customer name..." 
              className="search-input !pl-12 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="shipment-card !p-0 overflow-hidden border border-slate-800 shadow-xl shadow-slate-950/20">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-900/40 border-b border-slate-800">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice Code</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer Name</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Issue Date</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Due Date</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice Status</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total Invoice</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {invoices
                    .filter(inv => inv.customer.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-800/30 transition-all group">
                        <td className="px-8 py-6 font-mono text-sm font-black text-[#F15D38]">{inv.id}</td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-100">{inv.customer}</span>
                            {inv.paymentMethod && (
                              <span className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">{inv.paymentMethod}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-xs font-bold text-slate-400">{inv.date}</td>
                        <td className="px-8 py-6 text-xs font-bold text-slate-400">{inv.due}</td>
                        <td className="px-8 py-6">
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-full ${
                            inv.status === 'PAID' ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-800/20' : 
                            inv.status === 'PARTIAL' ? 'bg-amber-950/30 text-amber-400 border border-amber-800/20' : 'bg-rose-950/30 text-rose-400 border border-rose-800/20'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              inv.status === 'PAID' ? 'bg-emerald-500' : 
                              inv.status === 'PARTIAL' ? 'bg-amber-500' : 'bg-rose-500'
                            }`} />
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <span className="font-black text-slate-100">${inv.amount.toLocaleString()}</span>
                          {inv.amountPaidThisReceipt != null && inv.status === 'PARTIAL' && (
                            <p className="text-[10px] font-bold text-amber-400 mt-0.5">
                              Paid ${inv.amountPaidThisReceipt.toLocaleString()} · ${(inv.balanceDue ?? 0).toLocaleString()} due
                            </p>
                          )}
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {(inv.receiptPdfUrl || inv.mongoId) && (
                              <a
                                href={inv.receiptPdfUrl || `/api/invoices/${inv.mongoId}/pdf`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 hover:bg-slate-800 text-slate-400 hover:text-slate-100 rounded-lg transition-colors"
                                title="Download PDF receipt"
                              >
                                <Download size={16} />
                              </a>
                            )}
                            {inv.status !== 'PAID' && (
                              <button 
                                onClick={() => handleSettleInvoice(inv.id)}
                                className="p-2 hover:bg-emerald-950/30 text-slate-400 hover:text-emerald-400 rounded-lg transition-colors" 
                                title="Mark Paid"
                              >
                                <CheckCircle2 size={16} />
                              </button>
                            )}
                            <button 
                              onClick={() => handleDeleteInvoice(inv)}
                              className="p-2 hover:bg-rose-950/30 text-slate-400 hover:text-rose-500 rounded-lg transition-colors" 
                              title="Delete invoice"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Render: CHART OF ACCOUNTS */}
      {activeTab === 'accounts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in zoom-in-95 duration-300">
          {chartOfAccounts.map((account) => (
            <div key={account.name} className="shipment-card group hover:border-[#F15D38]/40 border border-slate-800 bg-[#131B2E] transition-all">
              <div className="flex justify-between items-center mb-6">
                <span className={`text-[10px] font-black px-2 py-1 rounded ${
                  account.type === 'Asset' ? 'bg-[#F15D38]/10 text-[#F15D38] border border-[#F15D38]/20' :
                  account.type === 'Liability' ? 'bg-rose-950/30 text-rose-400 border border-rose-800/20' :
                  account.type === 'Income' ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-800/20' : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}>
                  {account.type.toUpperCase()}
                </span>
                <MoreVertical size={16} className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h4 className="text-lg font-black text-slate-100 mb-1">{account.name}</h4>
              <p className="text-3xl font-black text-slate-100">${account.balance.toLocaleString()}</p>
              <div className="mt-6 pt-6 border-t border-slate-800/40 flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Balance</span>
                <button onClick={() => alert('Opening financial journal...')} className="text-[10px] font-black text-[#F15D38] hover:underline">View Journal</button>
              </div>
            </div>
          ))}
          <button 
            onClick={() => alert('New Ledger Account configuration popup')}
            className="shipment-card border-2 border-dashed border-slate-800 flex flex-col items-center justify-center gap-4 hover:border-[#F15D38]/40 hover:bg-[#F15D38]/5 transition-all py-12 bg-transparent"
          >
            <div className="p-4 rounded-full bg-[#131B2E] text-slate-500 border border-slate-800">
              <Plus size={32} />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Add New Account</p>
          </button>
        </div>
      )}
    </div>
  );
}
