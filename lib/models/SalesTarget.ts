import mongoose, { Document, Schema } from 'mongoose';

// Single global sales-target doc (Gap #6). Monthly revenue + quote goals;
// actuals are computed live from shipments and quotations.

export interface ISalesTarget extends Document {
  monthlyRevenueTarget: number;
  monthlyQuotesTarget: number;
}

const SalesTargetSchema = new Schema<ISalesTarget>({
  monthlyRevenueTarget: { type: Number, default: 0 },
  monthlyQuotesTarget: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.SalesTarget ||
  mongoose.model<ISalesTarget>('SalesTarget', SalesTargetSchema);
