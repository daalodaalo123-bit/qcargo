import mongoose, { Schema, model, models } from 'mongoose';

const ShipmentSchema = new Schema({
  shipmentNumber: { type: String, required: true, unique: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customerName: String, // Fallback if no customer object
  shipmentType: { type: String, enum: ['air', 'sea'], required: true },
  status: { 
    type: String, 
    enum: ['PENDING', 'IN_TRANSIT', 'ARRIVED', 'DELIVERED', 'COLLECTED'], 
    default: 'PENDING' 
  },
  batchId: { type: String }, // Links to FLT-123 or CTN-456
  origin: { type: String, default: 'China' },
  destination: { type: String, default: 'Hargeisa' },
  
  // Logistics
  totalWeight: Number,
  totalCBM: Number,
  totalCartons: { type: Number, default: 0 },
  itemDescription: String,
  
  // Financials
  pricePerUnit: Number, // price per kg or per cbm
  freightCharges: Number,
  customsCharges: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  totalCharges: Number,
  
  paymentStatus: { 
    type: String, 
    enum: ['unpaid', 'partial', 'paid'], 
    default: 'unpaid' 
  },
  paymentMethod: { 
    type: String, 
    enum: ['zaad', 'e-dahap', 'cash', 'waafi', 'dahap-plus', 'ali-pay'] 
  },
  paidAmount: { type: Number, default: 0 },
  
  // Courier Trackings (from China)
  courierPackages: [{
    courier: String,
    trackingNumber: String,
    goods: String,
    qty: Number,
  }],
  
  images: [String],
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Shipment = models.Shipment || model('Shipment', ShipmentSchema);

export default Shipment;
