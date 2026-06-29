import mongoose, { Document, Schema } from 'mongoose';

export interface ISourcingItem {
  productName: string;
  productUrl?: string;
  quantity: number;
  unitPriceCNY: number;
  totalUSD: number;
}

export interface ISupplierPayment {
  amountUSD: number;
  date: string;
  method?: string;
}

export interface ISourcing extends Document {
  orderNumber: string;
  customer: string;
  supplier: string;
  supplierId?: mongoose.Types.ObjectId;
  items: ISourcingItem[];
  totalCNY: number;
  exchangeRate: number;
  totalUSD: number;
  paidUSD: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  status: 'IN_WAREHOUSE' | 'ORDERED' | 'SHIPPED';
  paymentMethod?: string;
  supplierPayments: ISupplierPayment[];
  notes?: string;
  date: string;
}

const SupplierPaymentSchema = new Schema<ISupplierPayment>({
  amountUSD: { type: Number, required: true },
  date: { type: String, required: true },
  method: { type: String, default: '' },
}, { _id: false });

const SourcingItemSchema = new Schema<ISourcingItem>({
  productName: { type: String, required: true },
  productUrl: { type: String },
  quantity: { type: Number, required: true, default: 1 },
  unitPriceCNY: { type: Number, required: true, default: 0 },
  totalUSD: { type: Number, required: true, default: 0 },
});

const SourcingSchema = new Schema<ISourcing>({
  orderNumber: { type: String, required: true, unique: true },
  customer: { type: String, required: true },
  supplier: { type: String, default: 'Unknown Supplier' },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', default: null },
  items: [SourcingItemSchema],
  totalCNY: { type: Number, default: 0 },
  exchangeRate: { type: Number, default: 7.1 },
  totalUSD: { type: Number, required: true, default: 0 },
  paidUSD: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['PAID', 'PARTIAL', 'UNPAID'], default: 'UNPAID' },
  status: { type: String, enum: ['IN_WAREHOUSE', 'ORDERED', 'SHIPPED'], default: 'ORDERED' },
  paymentMethod: { type: String },
  supplierPayments: { type: [SupplierPaymentSchema], default: [] },
  notes: { type: String },
  date: { type: String, required: true },
}, { timestamps: true });

export default mongoose.models.Sourcing || mongoose.model<ISourcing>('Sourcing', SourcingSchema);
