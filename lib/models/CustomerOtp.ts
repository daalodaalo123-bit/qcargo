import mongoose, { Schema } from 'mongoose';

const CustomerOtpSchema = new Schema({
  phone: { type: String, required: true, index: true },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});

// TTL index — MongoDB auto-deletes docs after expiry
CustomerOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.CustomerOtp || mongoose.model('CustomerOtp', CustomerOtpSchema);
