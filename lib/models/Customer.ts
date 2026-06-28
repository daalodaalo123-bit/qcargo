import mongoose, { Document, Schema } from 'mongoose';
import { CreatedBySchema, type ICreatedBy } from './attribution';

export interface ICustomer extends Document {
  name: string;
  phone: string;
  email?: string;
  city?: string;
  totalShipments?: number;
  totalSpent?: number;
  status?: string;
  notes?: string;
  creditLimit?: number;
  createdBy?: ICreatedBy;
  agreedAirRate?: number;   // agreed $/kg for air freight
  agreedSeaRate?: number;   // agreed $/cbm for sea freight
  rateNotes?: string;
}

const CustomerSchema = new Schema<ICustomer>({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  city: { type: String, default: 'Hargeisa' },
  totalShipments: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  status: { type: String, default: 'ACTIVE' },
  notes: { type: String },
  creditLimit: { type: Number, default: 0 },
  createdBy: { type: CreatedBySchema, default: null },
  agreedAirRate: { type: Number, default: 0 },
  agreedSeaRate: { type: Number, default: 0 },
  rateNotes: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);
