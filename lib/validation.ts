import { z } from 'zod';

export const ShipmentSchema = z.object({
  shipmentNumber: z.string().min(1, 'Shipment number required'),
  customer: z.string().min(1, 'Customer name required'),
  phone: z.string().min(7, 'Phone number required'),
  type: z.enum(['AIR', 'SEA']),
  status: z.enum(['PENDING', 'IN_TRANSIT', 'ARRIVED']).optional(),
  paymentStatus: z.enum(['UNPAID', 'PARTIAL', 'PAID']).optional(),
  total: z.number({ coerce: true }).min(0),
  batch: z.string().optional(),
  date: z.string().min(1, 'Date required'),
  weight: z.number({ coerce: true }).optional(),
  cbm: z.number({ coerce: true }).optional(),
  rate: z.number({ coerce: true }).optional(),
  customs: z.number({ coerce: true }).optional(),
  tax: z.number({ coerce: true }).optional(),
  discount: z.number({ coerce: true }).optional(),
  notes: z.string().optional(),
  paymentMethod: z.string().optional(),
  paidAmount: z.number({ coerce: true }).optional(),
  amountPaid: z.number({ coerce: true }).optional(),
  items: z.array(z.object({
    description: z.string().min(1),
    qty: z.number({ coerce: true }).int().positive(),
    weight: z.number({ coerce: true }).optional(),
    cbm: z.number({ coerce: true }).optional(),
    value: z.number({ coerce: true }).optional(),
  })).optional(),
  courierPackages: z.array(z.object({
    courier: z.string().optional(),
    trackingNumber: z.string().optional(),
    goods: z.string().optional(),
    qty: z.number({ coerce: true }).optional(),
  })).optional(),
});

export const VendorBillSchema = z.object({
  vendor: z.string().min(1, 'Vendor name required'),
  date: z.string().min(1, 'Date required'),
  due: z.string().optional(),
  amount: z.number({ coerce: true }).min(0, 'Amount must be positive'),
  status: z.enum(['PAID', 'PENDING', 'OVERDUE']).optional(),
  category: z.string().min(1, 'Category required'),
  paymentMethod: z.string().optional(),
  batchId: z.string().optional(),
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
    quantity: z.number({ coerce: true }).positive(),
    price: z.number({ coerce: true }).min(0),
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
