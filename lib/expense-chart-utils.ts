export const EXPENSE_CHART_COLORS = [
  '#F15D38',
  '#0d9488',
  '#eab308',
  '#6366f1',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#8b5cf6',
  '#06b6d4',
  '#84cc16',
];

export type ChartSlice = {
  name: string;
  value: number;
  percent: number;
  color: string;
};

export function buildExpenseBreakdown(
  items: { key: string; amount: number }[],
  emptyLabel = 'No data'
): ChartSlice[] {
  const totals = items.reduce<Record<string, number>>((acc, item) => {
    const key = item.key.trim() || 'Uncategorized';
    acc[key] = (acc[key] || 0) + item.amount;
    return acc;
  }, {});

  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const grandTotal = entries.reduce((sum, [, v]) => sum + v, 0);

  if (grandTotal <= 0) {
    return [{ name: emptyLabel, value: 0, percent: 0, color: '#334155' }];
  }

  return entries.map(([name, value], index) => ({
    name,
    value,
    percent: (value / grandTotal) * 100,
    color: EXPENSE_CHART_COLORS[index % EXPENSE_CHART_COLORS.length],
  }));
}
