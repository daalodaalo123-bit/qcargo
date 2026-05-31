import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IInvoiceItem {
  description: string;
  qty: number;
  price: number;
  lineTotal: number;
}

export interface IInvoice extends Document {
  invoiceNumber: string;
  customerId?: Types.ObjectId;
  customerName: string;
  customerPhone: string;
  quotationId?: Types.ObjectId;
  shipmentId?: Types.ObjectId;
  items: IInvoiceItem[];
  goodsSummary: string;
  freightType: 'AIR' | 'SEA';
  subtotal: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  currency: string;
  paymentMethod: string;
  paymentDate: string;
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  receiptPdfUrl?: string;
  notes?: string;
}

const InvoiceItemSchema = new Schema<IInvoiceItem>({
  description: { type: String, required: true },
  qty: { type: Number, default: 1 },
  price: { type: Number, default: 0 },
  lineTotal: { type: Number, default: 0 },
});

const InvoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    quotationId: { type: Schema.Types.ObjectId, ref: 'Quotation' },
    shipmentId: { type: Schema.Types.ObjectId, ref: 'Shipment' },
    items: [InvoiceItemSchema],
    goodsSummary: { type: String, default: '' },
    freightType: { type: String, enum: ['AIR', 'SEA'], default: 'SEA' },
    subtotal: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    amountPaid: { type: Number, required: true },
    balanceDue: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    paymentMethod: { type: String, required: true },
    paymentDate: { type: String, required: true },
    paymentStatus: { type: String, enum: ['PAID', 'PARTIAL', 'UNPAID'], default: 'PAID' },
    receiptPdfUrl: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema);
