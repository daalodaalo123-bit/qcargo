import mongoose, { Schema, Document, Model } from 'mongoose';
import { CreatedBySchema, type ICreatedBy } from './attribution';

export interface IBatch extends Document {
  batchId: string;
  type: 'AIR' | 'SEA';
  origin: string;
  destination: string;
  status: 'IN_TRANSIT' | 'LOADING' | 'ARRIVED';
  shipments: number;
  weight: string;
  arrival: string; // ISO date string
  statusChanged?: boolean;
  createdBy?: ICreatedBy;
}

const BatchSchema: Schema = new Schema({
  batchId: { type: String, required: true, unique: true },
  type: { type: String, enum: ['AIR', 'SEA'], required: true },
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  status: { type: String, enum: ['IN_TRANSIT', 'LOADING', 'ARRIVED'], default: 'IN_TRANSIT' },
  shipments: { type: Number, default: 0 },
  weight: { type: String, default: '' },
  arrival: { type: String },
  statusChanged: { type: Boolean, default: false },
  createdBy: { type: CreatedBySchema, default: null },
}, { timestamps: true });

export const Batch: Model<IBatch> = mongoose.models.Batch as Model<IBatch> || mongoose.model<IBatch>('Batch', BatchSchema);
