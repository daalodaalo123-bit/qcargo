import mongoose, { Schema, Document } from 'mongoose';

export interface ILead extends Document {
  name: string;
  phone: string;
  source: 'WHATSAPP' | 'REFERRAL' | 'WALK_IN' | 'SOCIAL' | 'OTHER';
  stage: 'NEW' | 'CONTACTED' | 'QUOTED' | 'WON' | 'LOST';
  estimatedValue: number;
  notes: string;
  assignee: string;
  createdAt: Date;
}

const LeadSchema = new Schema<ILead>({
  name:           { type: String, required: true },
  phone:          { type: String, default: '' },
  source:         { type: String, enum: ['WHATSAPP', 'REFERRAL', 'WALK_IN', 'SOCIAL', 'OTHER'], default: 'WHATSAPP' },
  stage:          { type: String, enum: ['NEW', 'CONTACTED', 'QUOTED', 'WON', 'LOST'], default: 'NEW' },
  estimatedValue: { type: Number, default: 0 },
  notes:          { type: String, default: '' },
  assignee:       { type: String, default: '' },
}, { timestamps: true });

export default mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema);
