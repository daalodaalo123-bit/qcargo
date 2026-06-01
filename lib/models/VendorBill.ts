import mongoose, { Document, Schema } from 'mongoose';

export interface IVendorBill extends Document {
  vendor: string;
  date: string;
  due: string;
  amount: number;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  category: string;
  paymentMethod?: string;
  batchId?: string;
  description?: string;
}

const VendorBillSchema = new Schema<IVendorBill>({
  vendor: { type: String, required: true },
  date: { type: String, required: true },
  due: { type: String, required: true },
  amount: { type: Number, required: true, default: 0 },
  status: { type: String, enum: ['PAID', 'PENDING', 'OVERDUE'], default: 'PENDING' },
  category: { type: String, default: 'General' },
  paymentMethod: { type: String, default: 'CASH' },
  batchId: { type: String, default: '' },
  description: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.models.VendorBill || mongoose.model<IVendorBill>('VendorBill', VendorBillSchema);
