import mongoose, { Schema, model, models } from 'mongoose';

const PurchaseSchema = new Schema({
  orderNumber: { type: String, required: true, unique: true }, // e.g., PUR-2024-001
  customerName: { type: String, required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  supplierName: String,
  orderDate: { type: Date, default: Date.now },
  expectedDelivery: Date,
  status: { 
    type: String, 
    enum: ['PENDING', 'ORDERED', 'IN_WAREHOUSE', 'SHIPPED', 'CANCELLED'], 
    default: 'PENDING' 
  },
  items: [{
    productName: { type: String, required: true },
    productUrl: String,
    quantity: { type: Number, default: 1 },
    unitPriceCNY: Number, // Price in Yuan
    exchangeRate: { type: Number, default: 7.2 },
    unitPriceUSD: Number, // Calculated Price in USD
  }],
  totalAmountUSD: Number,
  paidAmountUSD: { type: Number, default: 0 },
  paymentStatus: { 
    type: String, 
    enum: ['UNPAID', 'PARTIAL', 'PAID'], 
    default: 'UNPAID' 
  },
  paymentMethod: { 
    type: String, 
    enum: ['ZAAD', 'EDAHAB', 'WAAFI', 'CASH', 'ALIPAY', 'OTHER'] 
  },
  notes: String,
  createdAt: { type: Date, default: Date.now },
});

const Purchase = models.Purchase || model('Purchase', PurchaseSchema);

export default Purchase;
