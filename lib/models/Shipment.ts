import mongoose, { Document, Schema } from 'mongoose';

export interface IProductNote {
  text: string;
  at: Date;
}

export interface IShipmentItem {
  description: string;
  qty: number;
  weight?: number;
  cbm?: number;
  value?: number;
  warehouseStatus?: 'IN_WAREHOUSE' | 'TAKEN' | 'LOST';
  statusDate?: Date;
  received?: boolean;
  receivedAt?: Date;
  // Filled in by the warehouse keeper from the tracking link — actual measured values.
  measuredWeight?: number;
  measuredCbm?: number;
  warehouseNotes?: IProductNote[];
}

export interface ICourierPackage {
  courier: string;
  trackingNumber: string;
  goods: string;
  qty: number;
  received?: boolean;
  receivedAt?: Date;
  // Filled in by the warehouse keeper from the tracking link — actual measured values.
  measuredWeight?: number;
  measuredCbm?: number;
  warehouseNotes?: IProductNote[];
}

export interface IShipment extends Document {
  shipmentNumber: string;
  customer: string;
  phone: string;
  type: 'AIR' | 'SEA';
  status: 'PENDING' | 'IN_TRANSIT' | 'ARRIVED';
  payment: 'PAID' | 'UNPAID';
  paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID';
  amountPaid: number;
  total: number;
  batch: string;
  date: string;
  weight?: number;
  cbm?: number;
  rate?: number;
  customs?: number;
  tax?: number;
  discount?: number;
  paymentMethod?: string;
  paidAmount?: number;
  notes?: string;
  items: IShipmentItem[];
  courierPackages: ICourierPackage[];
  takenAt?: Date;
}

const ProductNoteSchema = new Schema<IProductNote>({
  text: { type: String, required: true },
  at: { type: Date, default: Date.now },
}, { _id: false });

const ShipmentItemSchema = new Schema<IShipmentItem>({
  description: { type: String, required: true },
  qty: { type: Number, required: true, default: 1 },
  weight: { type: Number },
  cbm: { type: Number },
  value: { type: Number },
  warehouseStatus: { type: String, enum: ['IN_WAREHOUSE', 'TAKEN', 'LOST'], default: 'IN_WAREHOUSE' },
  statusDate: { type: Date },
  received: { type: Boolean, default: false },
  receivedAt: { type: Date },
  measuredWeight: { type: Number },
  measuredCbm: { type: Number },
  warehouseNotes: { type: [ProductNoteSchema], default: [] },
});

const CourierPackageSchema = new Schema<ICourierPackage>({
  courier: { type: String },
  trackingNumber: { type: String },
  goods: { type: String },
  qty: { type: Number, default: 1 },
  received: { type: Boolean, default: false },
  receivedAt: { type: Date },
  measuredWeight: { type: Number },
  measuredCbm: { type: Number },
  warehouseNotes: { type: [ProductNoteSchema], default: [] },
});

const ShipmentSchema = new Schema<IShipment>({
  shipmentNumber: { type: String, required: true, unique: true },
  customer: { type: String, required: true },
  phone: { type: String, required: true },
  type: { type: String, enum: ['AIR', 'SEA'], required: true },
  status: { type: String, enum: ['PENDING', 'IN_TRANSIT', 'ARRIVED'], default: 'PENDING' },
  payment: { type: String, enum: ['PAID', 'UNPAID'], default: 'UNPAID' },
  paymentStatus: { type: String, enum: ['UNPAID', 'PARTIAL', 'PAID'], default: 'UNPAID' },
  amountPaid: { type: Number, default: 0 },
  total: { type: Number, required: true },
  batch: { type: String, default: 'UNASSIGNED' },
  date: { type: String, required: true },
  weight: { type: Number },
  cbm: { type: Number },
  rate: { type: Number },
  customs: { type: Number },
  tax: { type: Number, default: 0 },
  discount: { type: Number },
  paymentMethod: { type: String },
  paidAmount: { type: Number },
  notes: { type: String },
  items: [ShipmentItemSchema],
  courierPackages: [CourierPackageSchema],
  takenAt: { type: Date },
}, { timestamps: true });

export default mongoose.models.Shipment || mongoose.model<IShipment>('Shipment', ShipmentSchema);
