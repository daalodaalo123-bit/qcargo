import {
  type ExpenseLike,
  type ExpensePeriod,
  filterExpensesByPeriod,
  parseExpenseDate,
  monthKey,
} from '@/lib/expense-analytics';
import {
  computeNetMargin,
  filterShipmentsByPeriod,
  type NetMarginBreakdown,
  type ShipmentLike,
} from '@/lib/net-margin';

export type InvoiceLike = {
  date: string;
  amount: number;
  status: string;
  amountPaid?: number;
};

export type ExpenseWithBatch = ExpenseLike & {
  batchId?: string;
};

export type ShipmentWithBatch = ShipmentLike & {
  batch?: string;
};

export type RevenueEfficiency = {
  netMarginPercent: number | null;
  expenseRatioPercent: number | null;
  profitPerKg: number | null;
  profitPerCbm: number | null;
};

export type BatchMarginRow = {
  batchId: string;
  revenue: number;
  expenses: number;
  grossProfit: number;
  netProfit: number;
  marginPercent: number | null;
};

export type LiveOverview = {
  freightRevenue: number;
  cashCollected: number;
  expenses: number;
  netProfit: number;
  netMarginPercent: number | null;
  outstandingInvoices: number;
  unpaidBills: number;
};

export function filterInvoicesByPeriod<T extends InvoiceLike>(
  invoices: T[],
  period: ExpensePeriod,
  reference = new Date()
): T[] {
  if (period === 'all') return invoices;
  const y = reference.getFullYear();
  const m = reference.getMonth();
  const target =
    period === 'this_month'
      ? { year: y, month: m }
      : { year: m === 0 ? y - 1 : y, month: m === 0 ? 11 : m - 1 };
  return invoices.filter((inv) => {
    const d = parseExpenseDate(inv.date);
    if (!d) return false;
    return d.getFullYear() === target.year && d.getMonth() === target.month;
  });
}

export function cashCollectedInPeriod(invoices: InvoiceLike[]): number {
  let total = 0;
  for (const inv of invoices) {
    if (inv.status === 'PAID') total += inv.amount;
    else if (inv.status === 'PARTIAL') total += inv.amountPaid ?? 0;
  }
  return total;
}

export function computeRevenueEfficiency(margin: NetMarginBreakdown): RevenueEfficiency {
  return {
    netMarginPercent: margin.netMarginPercent,
    expenseRatioPercent:
      margin.revenue > 0 ? (margin.expenses / margin.revenue) * 100 : null,
    profitPerKg: margin.totalKg > 0 ? margin.netProfit / margin.totalKg : null,
    profitPerCbm: margin.totalCbm > 0 ? margin.netProfit / margin.totalCbm : null,
  };
}

export function computeBatchMargins(
  shipments: ShipmentWithBatch[],
  expenses: ExpenseWithBatch[]
): BatchMarginRow[] {
  const buckets: Record<string, { revenue: number; expenses: number; gross: number }> = {};

  const ensure = (id: string) => {
    if (!buckets[id]) buckets[id] = { revenue: 0, expenses: 0, gross: 0 };
  };

  for (const s of shipments) {
    const id = (s.batch || 'UNASSIGNED').trim() || 'UNASSIGNED';
    ensure(id);
    const margin = computeNetMargin([s], 0);
    buckets[id].revenue += margin.revenue;
    buckets[id].gross += margin.grossProfit;
  }

  for (const e of expenses) {
    const id = (e.batchId || 'GENERAL').trim() || 'GENERAL';
    ensure(id);
    buckets[id].expenses += e.amount;
  }

  return Object.entries(buckets)
    .map(([batchId, b]) => {
      const netProfit = b.gross - b.expenses;
      return {
        batchId,
        revenue: b.revenue,
        expenses: b.expenses,
        grossProfit: b.gross,
        netProfit,
        marginPercent: b.revenue > 0 ? (netProfit / b.revenue) * 100 : null,
      };
    })
    .filter((r) => r.revenue > 0 || r.expenses > 0)
    .sort((a, b) => b.netProfit - a.netProfit);
}

export function computeLiveOverview(
  shipments: ShipmentWithBatch[],
  invoices: InvoiceLike[],
  expenses: ExpenseWithBatch[],
  unpaidInvoicesTotal: number,
  unpaidBillsTotal: number,
  period: ExpensePeriod = 'this_month',
  reference = new Date()
): LiveOverview & { margin: NetMarginBreakdown } {
  const periodShipments = filterShipmentsByPeriod(shipments, period, reference);
  const periodExpenses = filterExpensesByPeriod(expenses, period, reference);
  const periodInvoices = filterInvoicesByPeriod(invoices, period, reference);
  const expensesTotal = periodExpenses.reduce((s, e) => s + e.amount, 0);
  const margin = computeNetMargin(periodShipments, expensesTotal);

  return {
    freightRevenue: margin.revenue,
    cashCollected: cashCollectedInPeriod(periodInvoices),
    expenses: expensesTotal,
    netProfit: margin.netProfit,
    netMarginPercent: margin.netMarginPercent,
    outstandingInvoices: unpaidInvoicesTotal,
    unpaidBills: unpaidBillsTotal,
    margin,
  };
}

export function buildMonthlyFreightChart(
  shipments: ShipmentLike[],
  months = 6,
  reference = new Date()
): { name: string; amount: number }[] {
  const buckets: Record<string, number> = {};
  for (const s of shipments) {
    const d = parseExpenseDate(s.date);
    if (!d) continue;
    const key = monthKey(d.getFullYear(), d.getMonth());
    buckets[key] = (buckets[key] || 0) + (Number(s.total) || 0);
  }

  const points: { name: string; amount: number; sortKey: string }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(reference.getFullYear(), reference.getMonth() - i, 1);
    const key = monthKey(d.getFullYear(), d.getMonth());
    points.push({
      sortKey: key,
      name: d.toLocaleDateString('en-US', { month: 'short' }),
      amount: buckets[key] || 0,
    });
  }
  return points;
}

export function buildChartOfAccountsLive(
  freightRevenueAll: number,
  expensesAll: number,
  receivables: number,
  payables: number
) {
  return [
    { name: 'Freight Revenue (shipments)', type: 'Income', balance: freightRevenueAll },
    { name: 'Operating Expenses (bills)', type: 'Expense', balance: expensesAll },
    { name: 'Accounts Receivable', type: 'Asset', balance: receivables },
    { name: 'Accounts Payable', type: 'Liability', balance: payables },
  ];
}
