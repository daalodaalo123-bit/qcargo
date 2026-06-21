import mongoose, { Document, Schema } from 'mongoose';

export interface IPriorityTask extends Document {
  agentId: string;
  priority: number;
  customerName: string;
  product: string;
  deadline?: string;
  notes?: string;
  done: boolean;
}

const PriorityTaskSchema = new Schema<IPriorityTask>({
  agentId:      { type: String, required: true },
  priority:     { type: Number, required: true, default: 1 },
  customerName: { type: String, required: true },
  product:      { type: String, required: true },
  deadline:     { type: String },
  notes:        { type: String },
  done:         { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.models.PriorityTask || mongoose.model<IPriorityTask>('PriorityTask', PriorityTaskSchema);
