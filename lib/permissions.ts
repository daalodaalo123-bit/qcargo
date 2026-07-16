// Role definitions and page-access permissions for Q Cargo ERP.
// One role per user. Super Admin (role: 'admin') always sees everything.

export type StaffRole =
  | 'admin'            // Super Admin / Owner — full access (legacy + current)
  | 'branch_manager'
  | 'sales_rep'
  | 'operations'
  | 'accountant'
  | 'warehouse'
  | 'customer_service'
  | 'sourcing_agent';

export interface RoleMeta {
  label:       string;
  description: string;
  color:       string; // tailwind bg class for badge
  textColor:   string; // tailwind text class
}

export const ROLE_META: Record<StaffRole, RoleMeta> = {
  admin: {
    label:       'Super Admin',
    description: 'Full access to everything including settings and user management',
    color:       'bg-[#F15D38]/20',
    textColor:   'text-[#F15D38]',
  },
  branch_manager: {
    label:       'Branch Manager',
    description: 'Full operational access — everything except system settings',
    color:       'bg-purple-900/30',
    textColor:   'text-purple-400',
  },
  sales_rep: {
    label:       'Sales Representative',
    description: 'Quotations, customers, marketing, and batch tracking',
    color:       'bg-sky-900/30',
    textColor:   'text-sky-400',
  },
  operations: {
    label:       'Operations',
    description: 'Shipments, batches, inventory, and purchases',
    color:       'bg-teal-900/30',
    textColor:   'text-teal-400',
  },
  accountant: {
    label:       'Accountant',
    description: 'Expenses, accounting, purchases, and reports',
    color:       'bg-green-900/30',
    textColor:   'text-green-400',
  },
  warehouse: {
    label:       'Warehouse Staff',
    description: 'Shipments, batches, and inventory management',
    color:       'bg-amber-900/30',
    textColor:   'text-amber-400',
  },
  customer_service: {
    label:       'Customer Service',
    description: 'Customers, shipments, batches, and marketing',
    color:       'bg-pink-900/30',
    textColor:   'text-pink-400',
  },
  sourcing_agent: {
    label:       'Sourcing Agent',
    description: 'Sourcing orders, quotations, and purchases',
    color:       'bg-indigo-900/30',
    textColor:   'text-indigo-400',
  },
};

// Which hrefs each role is allowed to access.
// Super Admin ('admin') is handled separately — always allowed everywhere.
const ROLE_PAGES: Record<StaffRole, string[]> = {
  admin: [], // handled as full-access in canAccess()
  branch_manager: [
    '/admin',
    '/admin/shipments',
    '/admin/batches',
    '/admin/warehouse',
    '/admin/purchases',
    '/admin/customers',
    '/admin/pricing',
    '/admin/quotations',
    '/admin/contracts',
    '/admin/marketing',
    '/admin/expenses',
    '/admin/accounting',
    '/admin/reports',
    '/admin/todo',
  ],
  sales_rep: [
    '/admin',
    '/admin/quotations',
    '/admin/contracts',
    '/admin/customers',
    '/admin/marketing',
    '/admin/batches',
    '/admin/todo',
  ],
  operations: [
    '/admin',
    '/admin/shipments',
    '/admin/batches',
    '/admin/warehouse',
    '/admin/purchases',
    '/admin/todo',
  ],
  accountant: [
    '/admin',
    '/admin/expenses',
    '/admin/accounting',
    '/admin/purchases',
    '/admin/reports',
    '/admin/todo',
  ],
  warehouse: [
    '/admin',
    '/admin/shipments',
    '/admin/batches',
    '/admin/warehouse',
    '/admin/todo',
  ],
  customer_service: [
    '/admin',
    '/admin/customers',
    '/admin/shipments',
    '/admin/batches',
    '/admin/marketing',
    '/admin/todo',
  ],
  sourcing_agent: [
    '/admin',
    '/admin/pricing',
    '/admin/quotations',
    '/admin/contracts',
    '/admin/purchases',
    '/admin/todo',
  ],
};

export function canAccess(role: StaffRole | string | undefined | null, href: string): boolean {
  if (!role || role === 'admin' || role === 'staff') return true;
  const allowed = ROLE_PAGES[role as StaffRole];
  if (!allowed) return false;
  return allowed.some(p => {
    if (href === p) return true;                  // exact match
    if (p === '/admin') return false;             // '/admin' must be exact — never prefix-match sub-routes
    return href.startsWith(p + '/');              // e.g. /admin/customers/123
  });
}

export function getAllowedPages(role: StaffRole | string | undefined): string[] {
  if (!role || role === 'admin') return Object.values(ROLE_PAGES).flat();
  return ROLE_PAGES[role as StaffRole] ?? [];
}
