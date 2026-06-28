import mongoose, { Document, Schema } from 'mongoose';

// A line from a bank / Zaad / eDahab / cash statement, entered manually
// (Gap #4 — Bank Reconciliation). Ticked as matched against recorded payments.

export interface IBankTransaction extends Document {
  date: string;
  description: string;
  amount: number;
  direction: 'IN' | 'OUT';
  account: 'BANK' | 'ZAAD' | 'EDAHAB' | 'CASH';
  matched: boolean;
  note: string;
}

const BankTransactionSchema = new Schema<IBankTransaction>({
  date: { type: String, required: true },
  description: { type: String, default: '' },
  amount: { type: Number, required: true },
  direction: { type: String, enum: ['IN', 'OUT'], required: true },
  account: { type: String, enum: ['BANK', 'ZAAD', 'EDAHAB', 'CASH'], default: 'BANK' },
  matched: { type: Boolean, default: false },
  note: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.models.BankTransaction ||
  mongoose.model<IBankTransaction>('BankTransaction', BankTransactionSchema);
