import mongoose, { Document, Schema } from 'mongoose';

export interface IDirectMessage extends Document {
  agentId: string;
  agentName: string;
  fromAgent: boolean;
  text: string;
  read: boolean;
}

const DirectMessageSchema = new Schema<IDirectMessage>({
  agentId:   { type: String, required: true },
  agentName: { type: String, required: true },
  fromAgent: { type: Boolean, required: true },
  text:      { type: String, required: true },
  read:      { type: Boolean, default: false },
}, { timestamps: true });

DirectMessageSchema.index({ agentId: 1, createdAt: 1 });

export default mongoose.models.DirectMessage || mongoose.model<IDirectMessage>('DirectMessage', DirectMessageSchema);
