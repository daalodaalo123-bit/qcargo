import mongoose, { Document, Schema } from 'mongoose';

export interface IQuotationItem {
  description: string;
  notes?: string;
  qty: number;
  price: number;
}

export interface IQuotation extends Document {
  customer: string;
  phone?: string;
  goods: string;
  price: number;
  date: string;
  status: 'SENT' | 'DRAFT' | 'APPROVED' | 'REJECTED';
  paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID';
  amountPaid: number;
  type: 'AIR' | 'SEA';
  items: IQuotationItem[];
  commissionRate: number;
  commissionAmount: number;
}

const QuotationItemSchema = new Schema<IQuotationItem>({
  description: { type: String, required: true },
  notes: { type: String, default: '' },
  qty: { type: Number, default: 1 },
  price: { type: Number, default: 0 },
});

const QuotationSchema = new Schema<IQuotation>({
  customer: { type: String, required: true },
  phone: { type: String },
  goods: { type: String, default: 'General Cargo' },
  price: { type: Number, required: true, default: 0 },
  date: { type: String, required: true },
  status: { type: String, enum: ['SENT', 'DRAFT', 'APPROVED', 'REJECTED'], default: 'DRAFT' },
  paymentStatus: { type: String, enum: ['UNPAID', 'PARTIAL', 'PAID'], default: 'UNPAID' },
  amountPaid: { type: Number, default: 0 },
  type: { type: String, enum: ['AIR', 'SEA'], default: 'SEA' },
  items: [QuotationItemSchema],
  commissionRate: { type: Number, default: 7 },
  commissionAmount: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.Quotation || mongoose.model<IQuotation>('Quotation', QuotationSchema);
