import mongoose, { Document, Schema } from 'mongoose';

export interface IAdminHeartbeat extends Document {
  updatedAt: Date;
}

const AdminHeartbeatSchema = new Schema<IAdminHeartbeat>({}, { timestamps: true });

export default mongoose.models.AdminHeartbeat || mongoose.model<IAdminHeartbeat>('AdminHeartbeat', AdminHeartbeatSchema);
