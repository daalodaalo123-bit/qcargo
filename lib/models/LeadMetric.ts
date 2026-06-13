import mongoose, { Document, Schema } from 'mongoose';

export interface ILeadMetric extends Document {
  date: string;
  messages: number;
  quotesSent: number;
  ordersConfirmed: number;
}

const LeadMetricSchema = new Schema<ILeadMetric>({
  date: { type: String, required: true, unique: true },
  messages: { type: Number, default: 0 },
  quotesSent: { type: Number, default: 0 },
  ordersConfirmed: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.LeadMetric || mongoose.model<ILeadMetric>('LeadMetric', LeadMetricSchema);
