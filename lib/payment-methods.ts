export const EXPENSE_PAYMENT_METHODS = [
  { value: 'ZAAD', label: 'Zaad' },
  { value: 'EDAHAB', label: 'E-Dahab' },
  { value: 'WAAFI', label: 'Waafi' },
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK', label: 'Bank Transfer' },
  { value: 'OTHER', label: 'Other' },
] as const;

export type ExpensePaymentMethod = (typeof EXPENSE_PAYMENT_METHODS)[number]['value'];

export function formatPaymentMethod(value?: string): string {
  if (!value) return 'Not set';
  const found = EXPENSE_PAYMENT_METHODS.find((m) => m.value === value);
  return found?.label ?? value.replace(/_/g, ' ');
}
