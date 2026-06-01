export type ExpensePeriod = 'this_month' | 'last_month' | 'all';

export type ExpenseLike = {
  amount: number;
  date: string;
  status: string;
  category: string;
  vendor: string;
  paymentMethod?: string;
};

export function parseExpenseDate(dateStr: string): Date | null {
  if (!dateStr?.trim()) return null;
  const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function monthKey(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

export function formatMonthLabel(year: number, month: number) {
  return new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function filterExpensesByPeriod<T extends ExpenseLike>(
  expenses: T[],
  period: ExpensePeriod,
  reference = new Date()
): T[] {
  if (period === 'all') return expenses;

  const y = reference.getFullYear();
  const m = reference.getMonth();
  const target =
    period === 'this_month'
      ? { year: y, month: m }
      : { year: m === 0 ? y - 1 : y, month: m === 0 ? 11 : m - 1 };

  return expenses.filter((e) => {
    const d = parseExpenseDate(e.date);
    if (!d) return false;
    return d.getFullYear() === target.year && d.getMonth() === target.month;
  });
}

export type ExpensePeriodStats = {
  total: number;
  paid: number;
  pending: number;
  count: number;
  avgTransaction: number;
  largest: { vendor: string; amount: number } | null;
  topCategory: string;
  topVendor: string;
  byCategory: Record<string, number>;
  byPayment: Record<string, number>;
};

export function computePeriodStats(expenses: ExpenseLike[]): ExpensePeriodStats {
  const byCategory: Record<string, number> = {};
  const byPayment: Record<string, number> = {};
  let total = 0;
  let paid = 0;
  let pending = 0;
  let largest: { vendor: string; amount: number } | null = null;

  for (const e of expenses) {
    total += e.amount;
    if (e.status === 'PAID') paid += e.amount;
    else pending += e.amount;

    const cat = e.category?.trim() || 'Uncategorized';
    byCategory[cat] = (byCategory[cat] || 0) + e.amount;

    const pay = e.paymentMethod?.trim() || 'Not set';
    byPayment[pay] = (byPayment[pay] || 0) + e.amount;

    if (!largest || e.amount > largest.amount) {
      largest = { vendor: e.vendor, amount: e.amount };
    }
  }

  const topCategory =
    Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
  const topVendor =
    Object.entries(
      expenses.reduce<Record<string, number>>((acc, e) => {
        acc[e.vendor] = (acc[e.vendor] || 0) + e.amount;
        return acc;
      }, {})
    ).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

  return {
    total,
    paid,
    pending,
    count: expenses.length,
    avgTransaction: expenses.length > 0 ? total / expenses.length : 0,
    largest,
    topCategory,
    topVendor,
    byCategory,
    byPayment,
  };
}

export function periodChangePercent(current: number, previous: number): number | null {
  if (previous <= 0) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
}

export function dailySpendSeries(expenses: ExpenseLike[]) {
  const buckets: Record<string, number> = {};
  for (const e of expenses) {
    const d = parseExpenseDate(e.date);
    if (!d) continue;
    const key = d.toISOString().slice(0, 10);
    buckets[key] = (buckets[key] || 0) + e.amount;
  }
  return Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({
      date: new Date(`${date}T12:00:00`).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      amount,
    }));
}
