import mongoose, { Schema, model, models } from 'mongoose';

const InvoiceSchema = new Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customerName: String,
  invoiceType: { type: String, enum: ['CUSTOMER', 'EXPENSE'], default: 'CUSTOMER' },
  relatedShipmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' },
  relatedPurchaseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Purchase' },
  invoiceDate: { type: Date, default: Date.now },
  dueDate: Date,
  
  // Amounts
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  
  currency: { type: String, default: 'USD' },
  paymentStatus: { type: String, enum: ['UNPAID', 'PARTIAL', 'PAID'], default: 'UNPAID' },
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Invoice = models.Invoice || model('Invoice', InvoiceSchema);

export default Invoice;
