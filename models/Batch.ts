import mongoose, { Schema, model, models } from 'mongoose';

const BatchSchema = new Schema({
  batchId: { type: String, required: true, unique: true }, // e.g., DUR-2024-001 or FLT-123
  type: { type: String, enum: ['SEA', 'AIR'], default: 'SEA' },
  batch_type: { type: String, enum: ['flight', 'container'], default: 'flight' },
  customerName: { type: String, required: true },
  goods: { type: String, required: true },
  trackingNumbers: [String],
  status: { 
    type: String, 
    enum: ['PENDING', 'IN_TRANSIT', 'ARRIVED', 'DELIVERED', 'CLEARED'], 
    default: 'PENDING' 
  },
  origin: { type: String, default: 'China' },
  destination: { type: String, default: 'Somalia' },
  estimatedArrival: { type: Date },
  total_weight_kg: Number,
  total_cbm: Number,
  total_cartons: Number,
  tax_invoice_path: String,
  document_name: String,
  expenses: [{
    description: String,
    amount: Number,
    category: String,
    date: { type: Date, default: Date.now }
  }],
  images: [String], // Cloudinary URLs
  createdAt: { type: Date, default: Date.now },
});

const Batch = models.Batch || model('Batch', BatchSchema);

export default Batch;
