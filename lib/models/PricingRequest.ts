import mongoose, { Document, Schema } from 'mongoose';

export interface IPricingRequest extends Document {
  requestNumber: string;
  customerName: string;
  productName: string;
  description?: string;
  quantity: number;
  unit: string;
  targetPrice?: number;
  photos: string[];
  deadline?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  assignedAgents: string[];
  notes?: string;
  lastResponseAt?: Date;
}

const PricingRequestSchema = new Schema<IPricingRequest>({
  requestNumber:  { type: String, required: true, unique: true },
  customerName:   { type: String, required: true },
  productName:    { type: String, required: true },
  description:    { type: String },
  quantity:       { type: Number, required: true, default: 1 },
  unit:           { type: String, default: 'pcs' },
  targetPrice:    { type: Number },
  photos:         [{ type: String }],
  deadline:       { type: String },
  status:         { type: String, enum: ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], default: 'OPEN' },
  assignedAgents: [{ type: String }],
  notes:          { type: String },
  lastResponseAt: { type: Date },
}, { timestamps: true });

export default mongoose.models.PricingRequest || mongoose.model<IPricingRequest>('PricingRequest', PricingRequestSchema);
