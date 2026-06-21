import mongoose, { Document, Schema } from 'mongoose';

export interface IPricingResponse extends Document {
  requestId: string;
  agentId: string;
  agentName: string;
  agentCity: string;
  supplierName: string;
  supplierContact?: string;
  unitPrice: number;
  currency: 'USD' | 'CNY' | 'AED';
  moq?: number;
  leadTimeDays?: number;
  photos: string[];
  notes?: string;
  status: 'SUBMITTED' | 'SELECTED' | 'REJECTED';
}

const PricingResponseSchema = new Schema<IPricingResponse>({
  requestId:       { type: String, required: true },
  agentId:         { type: String, required: true },
  agentName:       { type: String, required: true },
  agentCity:       { type: String, required: true },
  supplierName:    { type: String, required: true },
  supplierContact: { type: String },
  unitPrice:       { type: Number, required: true },
  currency:        { type: String, enum: ['USD', 'CNY', 'AED'], default: 'USD' },
  moq:             { type: Number },
  leadTimeDays:    { type: Number },
  photos:          [{ type: String }],
  notes:           { type: String },
  status:          { type: String, enum: ['SUBMITTED', 'SELECTED', 'REJECTED'], default: 'SUBMITTED' },
}, { timestamps: true });

export default mongoose.models.PricingResponse || mongoose.model<IPricingResponse>('PricingResponse', PricingResponseSchema);
