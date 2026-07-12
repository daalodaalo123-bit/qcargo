import mongoose, { Document, Schema } from 'mongoose';
import { CreatedBySchema, type ICreatedBy } from './attribution';

// China supplier directory — a mini company profile per supplier so the
// team can find them and re-order. Order history is matched live from Sourcing.
// Verification fields cover the 16-question supplier evaluation message.

export const SUPPLIER_DOC_TYPES = [
  'Business License',
  'Manufacturing License',
  'Export License',
  'CE Certificate',
  'ISO Certificate',
  'CCC Certificate',
  'SGS Certificate',
  'Other Certification',
  'Company Profile',
  'Catalog',
  'Factory Photo',
  'Other',
] as const;
export type SupplierDocType = typeof SUPPLIER_DOC_TYPES[number];

export interface ISupplierDoc {
  type: SupplierDocType;
  url: string;
  name: string;        // original file name
  expiry?: string;     // YYYY-MM-DD, optional (licenses/certs)
  note?: string;
  uploadedAt?: Date;
}

export type VerificationStatus = 'NOT_VERIFIED' | 'DOCS_REQUESTED' | 'VERIFIED';

export interface ISupplier extends Document {
  name: string;
  location: string;     // city in China
  products: string;     // what they sell
  wechat: string;
  phone: string;
  whatsapp: string;
  storeLink: string;    // Alibaba / Taobao
  contactPerson: string;
  notes: string;
  // Verification — factory facts
  factoryAddress: string;
  officeAddress: string;
  registrationYear: string;
  employees: string;
  factorySizeSqm: string;
  // Verification — capability
  productionCapacity: string;
  qcProcess: string;
  warrantyPolicy: string;
  exportMarkets: string;
  // Verification — links & media
  website: string;
  socialMedia: string;
  videoLinks: string;   // one link per line
  // Verification — documents & status
  documents: ISupplierDoc[];
  verificationStatus: VerificationStatus;
  docsRequestedAt?: Date;
  verifiedAt?: Date;
  createdBy?: ICreatedBy;
}

const SupplierDocSchema = new Schema<ISupplierDoc>({
  type: { type: String, required: true },
  url: { type: String, required: true },
  name: { type: String, default: '' },
  expiry: { type: String, default: '' },
  note: { type: String, default: '' },
  uploadedAt: { type: Date, default: Date.now },
}, { _id: true });

const SupplierSchema = new Schema<ISupplier>({
  name: { type: String, required: true, trim: true },
  location: { type: String, default: '' },
  products: { type: String, default: '' },
  wechat: { type: String, default: '' },
  phone: { type: String, default: '' },
  whatsapp: { type: String, default: '' },
  storeLink: { type: String, default: '' },
  contactPerson: { type: String, default: '' },
  notes: { type: String, default: '' },
  factoryAddress: { type: String, default: '' },
  officeAddress: { type: String, default: '' },
  registrationYear: { type: String, default: '' },
  employees: { type: String, default: '' },
  factorySizeSqm: { type: String, default: '' },
  productionCapacity: { type: String, default: '' },
  qcProcess: { type: String, default: '' },
  warrantyPolicy: { type: String, default: '' },
  exportMarkets: { type: String, default: '' },
  website: { type: String, default: '' },
  socialMedia: { type: String, default: '' },
  videoLinks: { type: String, default: '' },
  documents: { type: [SupplierDocSchema], default: [] },
  verificationStatus: { type: String, enum: ['NOT_VERIFIED', 'DOCS_REQUESTED', 'VERIFIED'], default: 'NOT_VERIFIED' },
  docsRequestedAt: { type: Date, default: null },
  verifiedAt: { type: Date, default: null },
  createdBy: { type: CreatedBySchema, default: null },
}, { timestamps: true });

export default mongoose.models.Supplier || mongoose.model<ISupplier>('Supplier', SupplierSchema);
