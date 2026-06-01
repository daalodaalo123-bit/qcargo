'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { buildExpenseBreakdown, type ChartSlice } from '@/lib/expense-chart-utils';

interface ExpenseChartsProps {
  expenses: { category: string; amount: number; paymentMethod?: string }[];
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: ChartSlice }[];
}) {
  if (!active || !payload?.[0]) return null;
  const item = payload[0].payload;
  return (
    <div className="bg-[#0B0F19] border border-slate-700 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-xs font-black text-slate-100">{item.name}</p>
      <p className="text-[10px] font-bold text-slate-400 mt-1">
        ${item.value.toLocaleString(undefined, { minimumFractionDigits: 2 })} · {item.percent.toFixed(1)}%
      </p>
    </div>
  );
}

function DonutPanel({
  title,
  data,
  emptyMessage,
}: {
  title: string;
  data: ChartSlice[];
  emptyMessage: string;
}) {
  const hasData = data.length > 0 && data[0].value > 0;

  return (
    <div className="shipment-card border border-slate-800 bg-[#131B2E]">
      <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest mb-6">{title}</h3>
      {!hasData ? (
        <p className="text-xs font-bold text-slate-500 text-center py-16">{emptyMessage}</p>
      ) : (
        <>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={88}
                  paddingAngle={2}
                  stroke="#131B2E"
                  strokeWidth={2}
                >
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-4 space-y-2 max-h-40 overflow-y-auto">
            {data.map((slice) => (
              <li key={slice.name} className="flex items-center justify-between gap-3 text-xs">
                <span className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span className="font-bold text-slate-300 truncate">{slice.name}</span>
                </span>
                <span className="font-black text-slate-100 shrink-0">{slice.percent.toFixed(1)}%</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default function ExpenseCharts({ expenses }: ExpenseChartsProps) {
  const categoryData = useMemo(
    () =>
      buildExpenseBreakdown(
        expenses.map((e) => ({ key: e.category, amount: e.amount })),
        'No expenses yet'
      ),
    [expenses]
  );

  const paymentData = useMemo(
    () =>
      buildExpenseBreakdown(
        expenses.map((e) => ({
          key: e.paymentMethod?.trim() || 'Not set',
          amount: e.amount,
        })),
        'No payment data'
      ),
    [expenses]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <DonutPanel
        title="Spend by category"
        data={categoryData}
        emptyMessage="Record expenses to see category breakdown."
      />
      <DonutPanel
        title="Spend by payment method"
        data={paymentData}
        emptyMessage="Record expenses with Zaad, Cash, etc. to see this chart."
      />
    </div>
  );
}
