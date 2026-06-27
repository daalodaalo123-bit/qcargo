import mongoose, { Document, Schema } from 'mongoose';

export type AdminRole =
  | 'admin'
  | 'branch_manager'
  | 'sales_rep'
  | 'operations'
  | 'accountant'
  | 'warehouse'
  | 'customer_service'
  | 'sourcing_agent';

export interface IAdminUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  name: string;
  role: AdminRole;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ROLES: AdminRole[] = [
  'admin', 'branch_manager', 'sales_rep', 'operations',
  'accountant', 'warehouse', 'customer_service', 'sourcing_agent',
];

const AdminUserSchema = new Schema<IAdminUser>(
  {
    username:     { type: String, required: true, unique: true, lowercase: true, trim: true },
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name:         { type: String, required: true },
    role:         { type: String, enum: ROLES, default: 'sales_rep' },
    active:       { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.AdminUser || mongoose.model<IAdminUser>('AdminUser', AdminUserSchema);
