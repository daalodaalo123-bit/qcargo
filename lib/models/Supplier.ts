import mongoose, { Document, Schema } from 'mongoose';
import { CreatedBySchema, type ICreatedBy } from './attribution';

// China supplier directory — a mini company profile per supplier so the
// team can find them and re-order. Order history is matched live from Sourcing.

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
  createdBy?: ICreatedBy;
}

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
  createdBy: { type: CreatedBySchema, default: null },
}, { timestamps: true });

export default mongoose.models.Supplier || mongoose.model<ISupplier>('Supplier', SupplierSchema);
