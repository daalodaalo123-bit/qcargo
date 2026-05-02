import mongoose, { Schema, model, models } from 'mongoose';

const CustomerSchema = new Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: String,
  address: String,
  city: { type: String, default: 'Hargeisa' },
  
  // Logistics Metrics
  totalShipments: { type: Number, default: 0 },
  totalWeightKG: { type: Number, default: 0 },
  totalVolumeCBM: { type: Number, default: 0 },
  
  // Financial Metrics
  totalSpent: { type: Number, default: 0 },
  currentBalance: { type: Number, default: 0 }, // Debt
  
  // CRM
  status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'VIP'], default: 'ACTIVE' },
  notes: String,
  lastOrderDate: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Customer = models.Customer || model('Customer', CustomerSchema);

export default Customer;
