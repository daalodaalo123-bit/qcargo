import { type ExpensePeriod, parseExpenseDate } from '@/lib/expense-analytics';

/** Q CARGO modeled profit: 7% of freight revenue + $50/CBM + $1.50/KG */
export const NET_MARGIN_RULES = {
  revenueProfitRate: 0.07,
  profitPerCbm: 50,
  profitPerKg: 1.5,
} as const;

export type ShipmentLike = {
  date: string;
  total: number;
  type?: string;
  weight?: number;
  cbm?: number;
};

export type NetMarginBreakdown = {
  revenue: number;
  totalKg: number;
  totalCbm: number;
  shipmentCount: number;
  profitFromRevenue: number;
  profitFromCbm: number;
  profitFromKg: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
  netMarginPercent: number | null;
};

export function filterShipmentsByPeriod<T extends ShipmentLike>(
  shipments: T[],
  period: ExpensePeriod,
  reference = new Date()
): T[] {
  if (period === 'all') return shipments;

  const y = reference.getFullYear();
  const m = reference.getMonth();
  const target =
    period === 'this_month'
      ? { year: y, month: m }
      : { year: m === 0 ? y - 1 : y, month: m === 0 ? 11 : m - 1 };

  return shipments.filter((s) => {
    const d = parseExpenseDate(s.date);
    if (!d) return false;
    return d.getFullYear() === target.year && d.getMonth() === target.month;
  });
}

export function aggregateShipmentUnits(shipments: ShipmentLike[]) {
  let revenue = 0;
  let totalKg = 0;
  let totalCbm = 0;

  for (const s of shipments) {
    revenue += Number(s.total) || 0;
    const mode = (s.type || 'AIR').toUpperCase();
    if (mode === 'SEA') {
      totalCbm += Number(s.cbm) || 0;
    } else {
      totalKg += Number(s.weight) || 0;
    }
  }

  return { revenue, totalKg, totalCbm, shipmentCount: shipments.length };
}

export function computeNetMargin(
  shipments: ShipmentLike[],
  expensesTotal: number
): NetMarginBreakdown {
  const { revenue, totalKg, totalCbm, shipmentCount } = aggregateShipmentUnits(shipments);

  const profitFromRevenue = revenue * NET_MARGIN_RULES.revenueProfitRate;
  const profitFromCbm = totalCbm * NET_MARGIN_RULES.profitPerCbm;
  const profitFromKg = totalKg * NET_MARGIN_RULES.profitPerKg;
  const grossProfit = profitFromRevenue + profitFromCbm + profitFromKg;
  const expenses = expensesTotal;
  const netProfit = grossProfit - expenses;
  const netMarginPercent = revenue > 0 ? (netProfit / revenue) * 100 : null;

  return {
    revenue,
    totalKg,
    totalCbm,
    shipmentCount,
    profitFromRevenue,
    profitFromCbm,
    profitFromKg,
    grossProfit,
    expenses,
    netProfit,
    netMarginPercent,
  };
}
