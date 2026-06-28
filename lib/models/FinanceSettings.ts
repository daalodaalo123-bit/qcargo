import mongoose, { Document, Schema } from 'mongoose';

// Single global finance-config document (Gap #4). Holds manual FX rates,
// VAT/tax config (off by default), and the opening cash balance used by the
// Balance Sheet.

export interface IFinanceSettings extends Document {
  rates: { CNY: number; AED: number };
  vatEnabled: boolean;
  vatRate: number;       // percent, e.g. 5 means 5%
  vatLabel: string;
  openingCashBalance: number;
}

const FinanceSettingsSchema = new Schema<IFinanceSettings>({
  rates: {
    CNY: { type: Number, default: 7.10 },  // 1 USD = 7.10 CNY
    AED: { type: Number, default: 3.67 },  // 1 USD = 3.67 AED
  },
  vatEnabled: { type: Boolean, default: false },
  vatRate: { type: Number, default: 0 },
  vatLabel: { type: String, default: 'VAT' },
  openingCashBalance: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.FinanceSettings ||
  mongoose.model<IFinanceSettings>('FinanceSettings', FinanceSettingsSchema);
