import mongoose, { Schema, Document } from 'mongoose';

export interface IFollowUp extends Document {
  customerId: string;
  customerName: string;
  dueDate: string;
  note: string;
  status: 'PENDING' | 'DONE';
  createdAt: Date;
}

const FollowUpSchema = new Schema<IFollowUp>({
  customerId:   { type: String, required: true, index: true },
  customerName: { type: String, required: true },
  dueDate:      { type: String, required: true },
  note:         { type: String, required: true },
  status:       { type: String, enum: ['PENDING', 'DONE'], default: 'PENDING' },
}, { timestamps: true });

export default mongoose.models.FollowUp || mongoose.model<IFollowUp>('FollowUp', FollowUpSchema);
