import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomerNote extends Document {
  customerId: string;
  customerName: string;
  type: 'NOTE' | 'CALL' | 'MEETING' | 'COMPLAINT';
  text: string;
  createdAt: Date;
}

const CustomerNoteSchema = new Schema<ICustomerNote>({
  customerId:   { type: String, required: true, index: true },
  customerName: { type: String, required: true },
  type:         { type: String, enum: ['NOTE', 'CALL', 'MEETING', 'COMPLAINT'], default: 'NOTE' },
  text:         { type: String, required: true },
}, { timestamps: true });

export default mongoose.models.CustomerNote || mongoose.model<ICustomerNote>('CustomerNote', CustomerNoteSchema);
