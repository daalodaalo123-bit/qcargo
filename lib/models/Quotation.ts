import mongoose, { Document, Schema } from 'mongoose';

export interface IQuotationItem {
  description: string;
  price: number;
}

export interface IQuotation extends Document {
  customer: string;
  phone?: string;
  goods: string;
  price: number;
  date: string;
  status: 'SENT' | 'DRAFT' | 'APPROVED' | 'REJECTED';
  type: 'AIR' | 'SEA';
  items: IQuotationItem[];
}

const QuotationItemSchema = new Schema<IQuotationItem>({
  description: { type: String, required: true },
  price: { type: Number, default: 0 },
});

const QuotationSchema = new Schema<IQuotation>({
  customer: { type: String, required: true },
  phone: { type: String },
  goods: { type: String, default: 'General Cargo' },
  price: { type: Number, required: true, default: 0 },
  date: { type: String, required: true },
  status: { type: String, enum: ['SENT', 'DRAFT', 'APPROVED', 'REJECTED'], default: 'DRAFT' },
  type: { type: String, enum: ['AIR', 'SEA'], default: 'SEA' },
  items: [QuotationItemSchema],
}, { timestamps: true });

export default mongoose.models.Quotation || mongoose.model<IQuotation>('Quotation', QuotationSchema);
