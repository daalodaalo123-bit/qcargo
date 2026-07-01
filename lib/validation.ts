import { z } from 'zod';

const num = z.coerce.number();

export const ShipmentSchema = z.object({
  shipmentNumber: z.string().min(1, 'Shipment number required'),
  customer: z.string().min(1, 'Customer name required'),
  phone: z.string().min(7, 'Phone number required'),
  type: z.enum(['AIR', 'SEA']),
  status: z.enum(['PENDING', 'IN_TRANSIT', 'ARRIVED']).optional(),
  paymentStatus: z.enum(['UNPAID', 'PARTIAL', 'PAID']).optional(),
  total: num.min(0),
  batch: z.string().optional(),
  date: z.string().min(1, 'Date required'),
  weight: num.optional(),
  cbm: num.optional(),
  rate: num.optional(),
  customs: num.optional(),
  tax: num.optional(),
  discount: num.optional(),
  notes: z.string().optional(),
  paymentMethod: z.string().optional(),
  paidAmount: num.optional(),
  amountPaid: num.optional(),
  priceLines: z.array(z.object({
    product: z.string().min(1),
    weight: num.optional(),
    cbm: num.optional(),
    rate: num.optional(),
    customs: num.optional(),
    tax: num.optional(),
  })).optional(),
  items: z.array(z.object({
    description: z.string().min(1),
    qty: z.coerce.number().int().positive(),
    weight: num.optional(),
    cbm: num.optional(),
    value: num.optional(),
  })).optional(),
  courierPackages: z.array(z.object({
    courier: z.string().optional(),
    trackingNumber: z.string().optional(),
    goods: z.string().optional(),
    qty: num.optional(),
  })).optional(),
});

export const VendorBillSchema = z.object({
  vendor: z.string().min(1, 'Vendor name required'),
  date: z.string().min(1, 'Date required'),
  due: z.string().optional(),
  amount: num.min(0, 'Amount must be positive'),
  amountPaid: num.min(0).optional(),
  status: z.enum(['PAID', 'PENDING', 'PARTIAL', 'OVERDUE']).optional(),
  category: z.string().min(1, 'Category required'),
  paymentMethod: z.string().optional(),
  batchId: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
});

export const QuotationSchema = z.object({
  customer: z.string().min(1, 'Customer name required'),
  phone: z.string().min(7, 'Phone required'),
  goodsDescription: z.string().optional(),
  type: z.enum(['AIR', 'SEA']).optional(),
  status: z.enum(['DRAFT', 'SENT', 'APPROVED', 'REJECTED']).optional(),
  items: z.array(z.object({
    description: z.string().min(1),
    quantity: num.positive(),
    price: num.min(0),
  })).optional(),
  notes: z.string().optional(),
});

export function zodError(error: z.ZodError) {
  const issues = (error as any).issues ?? (error as any).errors ?? [];
  return {
    error: 'Validation failed',
    details: issues.map((e: any) => `${e.path?.join('.') || 'field'}: ${e.message}`).join('; '),
  };
}
