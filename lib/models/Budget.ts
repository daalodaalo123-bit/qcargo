import mongoose, { Document, Schema } from 'mongoose';

// Monthly budget target per expense category (Gap #4 — Budget vs Actual).
// One doc per category; actual spend is computed live from vendor bills.

export interface IBudget extends Document {
  category: string;
  monthlyBudget: number;
}

const BudgetSchema = new Schema<IBudget>({
  category: { type: String, required: true, unique: true, trim: true },
  monthlyBudget: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.Budget ||
  mongoose.model<IBudget>('Budget', BudgetSchema);
