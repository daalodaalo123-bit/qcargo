import mongoose, { Document, Schema } from 'mongoose';

export interface ITypingStatus extends Document {
  requestId: string;
  agentId: string;
  adminTypingAt?: Date;
  agentTypingAt?: Date;
}

const TypingStatusSchema = new Schema<ITypingStatus>({
  requestId:    { type: String, required: true },
  agentId:      { type: String, required: true },
  adminTypingAt: { type: Date },
  agentTypingAt: { type: Date },
}, { timestamps: false });

TypingStatusSchema.index({ requestId: 1, agentId: 1 }, { unique: true });

export default mongoose.models.TypingStatus || mongoose.model<ITypingStatus>('TypingStatus', TypingStatusSchema);
