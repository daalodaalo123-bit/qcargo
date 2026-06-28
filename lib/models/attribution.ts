import { Schema } from 'mongoose';

// Shared sub-schemas used for staff attribution (Gap #8 — HR & Staff KPIs).
// `createdBy` stamps which logged-in staff member created a record.
// `payments[]` records each individual payment event with who took it.

export interface ICreatedBy {
  id: string;
  name: string;
}

export interface IPaymentEntry {
  amount: number;
  by: ICreatedBy;
  method?: string;
  at: Date;
}

export const CreatedBySchema = new Schema<ICreatedBy>(
  {
    id: { type: String, default: '' },
    name: { type: String, default: '' },
  },
  { _id: false }
);

export const PaymentEntrySchema = new Schema<IPaymentEntry>(
  {
    amount: { type: Number, required: true },
    by: {
      id: { type: String, default: '' },
      name: { type: String, default: '' },
    },
    method: { type: String, default: '' },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);
