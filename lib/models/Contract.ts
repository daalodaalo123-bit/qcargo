import mongoose, { Document, Schema } from 'mongoose';

export interface IContractItem {
  description: string;
  qty: number;
  price: number;
}

export interface IContractTermSection {
  heading: string;
  body: string;                      // plain text; lines starting with "- " render as bullets
}

export interface IContract extends Document {
  ref: string;                       // Agreement reference, e.g. QT-77AF919C (from quotation) or QC-AGR-xxxx (standalone)
  quotationId?: mongoose.Types.ObjectId | null;
  customer: string;
  phone?: string;
  email?: string;
  deliveryTo?: string;
  deliveryPhone?: string;
  deliveryEmail?: string;
  freightType: 'AIR' | 'SEA';
  items: IContractItem[];
  subtotal: number;
  commissionRate: number;
  commissionAmount: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID';
  receiptNo?: string;                // e.g. INV-32133196
  paymentMethod?: string;            // e.g. eDahab, Zaad, Bank
  paymentDate?: string;              // ISO date (yyyy-mm-dd)
  issuedDate: string;                // ISO date (yyyy-mm-dd) shown as "Issued:" on the agreement
  quotationDate?: string;            // ISO date of the underlying quotation
  terms: IContractTermSection[];     // custom (edited) terms; empty = standard terms
  status: 'DRAFT' | 'SENT' | 'SIGNED';
  pdfUrl?: string;
  sentAt?: Date | null;
  signedAt?: Date | null;
  notes?: string;
}

const ContractItemSchema = new Schema<IContractItem>({
  description: { type: String, required: true },
  qty: { type: Number, default: 1 },
  price: { type: Number, default: 0 },
}, { _id: false });

const ContractTermSectionSchema = new Schema<IContractTermSection>({
  heading: { type: String, default: '' },
  body: { type: String, default: '' },
}, { _id: false });

const ContractSchema = new Schema<IContract>({
  ref: { type: String, required: true, unique: true },
  quotationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation', default: null },
  customer: { type: String, required: true },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  deliveryTo: { type: String, default: '' },
  deliveryPhone: { type: String, default: '' },
  deliveryEmail: { type: String, default: '' },
  freightType: { type: String, enum: ['AIR', 'SEA'], default: 'SEA' },
  items: { type: [ContractItemSchema], default: [] },
  subtotal: { type: Number, default: 0 },
  commissionRate: { type: Number, default: 10 },
  commissionAmount: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  amountPaid: { type: Number, default: 0 },
  balanceDue: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['UNPAID', 'PARTIAL', 'PAID'], default: 'UNPAID' },
  receiptNo: { type: String, default: '' },
  paymentMethod: { type: String, default: '' },
  paymentDate: { type: String, default: '' },
  issuedDate: { type: String, required: true },
  quotationDate: { type: String, default: '' },
  terms: { type: [ContractTermSectionSchema], default: [] },
  status: { type: String, enum: ['DRAFT', 'SENT', 'SIGNED'], default: 'DRAFT' },
  pdfUrl: { type: String, default: '' },
  sentAt: { type: Date, default: null },
  signedAt: { type: Date, default: null },
  notes: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.models.Contract || mongoose.model<IContract>('Contract', ContractSchema);
