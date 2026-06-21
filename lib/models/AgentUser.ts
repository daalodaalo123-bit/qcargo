import mongoose, { Document, Schema } from 'mongoose';

export interface IAgentUser extends Document {
  name: string;
  city: string;
  country: string;
  username: string;
  passwordHash: string;
  language: 'en' | 'ar' | 'zh';
  phone?: string;
  email?: string;
  active: boolean;
  lastSeen?: Date;
}

const AgentUserSchema = new Schema<IAgentUser>({
  name:         { type: String, required: true },
  city:         { type: String, required: true },
  country:      { type: String, required: true, default: 'China' },
  username:     { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  language:     { type: String, enum: ['en', 'ar', 'zh'], default: 'en' },
  phone:        { type: String },
  email:        { type: String },
  active:       { type: Boolean, default: true },
  lastSeen:     { type: Date },
}, { timestamps: true });

export default mongoose.models.AgentUser || mongoose.model<IAgentUser>('AgentUser', AgentUserSchema);
