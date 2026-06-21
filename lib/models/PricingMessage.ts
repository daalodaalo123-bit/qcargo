import mongoose, { Document, Schema } from 'mongoose';

export interface IPricingMessage extends Document {
  requestId: string;
  agentId: string;
  agentName: string;
  fromAgent: boolean;
  text: string;
  read: boolean;
}

const PricingMessageSchema = new Schema<IPricingMessage>({
  requestId: { type: String, required: true },
  agentId:   { type: String, required: true },
  agentName: { type: String, required: true },
  fromAgent: { type: Boolean, required: true },
  text:      { type: String, required: true },
  read:      { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.models.PricingMessage || mongoose.model<IPricingMessage>('PricingMessage', PricingMessageSchema);
