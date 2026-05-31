import mongoose, { Document, Schema } from 'mongoose';

export interface ISourcingItem {
  productName: string;
  productUrl?: string;
  quantity: number;
  unitPriceCNY: number;
  totalUSD: number;
}

export interface ISourcing extends Document {
  orderNumber: string;
  customer: string;
  supplier: string;
  items: ISourcingItem[];
  totalUSD: number;
  paidUSD: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  status: 'IN_WAREHOUSE' | 'ORDERED' | 'SHIPPED';
  paymentMethod?: string;
  notes?: string;
  date: string;
}

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
  items: [SourcingItemSchema],
  totalUSD: { type: Number, required: true, default: 0 },
  paidUSD: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['PAID', 'PARTIAL', 'UNPAID'], default: 'UNPAID' },
  status: { type: String, enum: ['IN_WAREHOUSE', 'ORDERED', 'SHIPPED'], default: 'ORDERED' },
  paymentMethod: { type: String },
  notes: { type: String },
  date: { type: String, required: true },
}, { timestamps: true });

export default mongoose.models.Sourcing || mongoose.model<ISourcing>('Sourcing', SourcingSchema);
