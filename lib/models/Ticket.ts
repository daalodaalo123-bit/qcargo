import mongoose, { Document, Schema } from 'mongoose';
import { CreatedBySchema, type ICreatedBy } from './attribution';

// Customer complaint / support ticket (Gap #6 — CRM ticket system).

export type TicketCategory = 'DAMAGED' | 'LOST' | 'DELAYED' | 'BILLING' | 'OTHER';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ITicket extends Document {
  ticketNumber: string;
  customerName: string;
  customerPhone: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assignedToName: string;
  createdBy?: ICreatedBy;
  resolvedAt: Date | null;
}

const TicketSchema = new Schema<ITicket>({
  ticketNumber: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, default: '' },
  subject: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, enum: ['DAMAGED', 'LOST', 'DELAYED', 'BILLING', 'OTHER'], default: 'OTHER' },
  priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
  status: { type: String, enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED'], default: 'OPEN' },
  assignedToName: { type: String, default: '' },
  createdBy: { type: CreatedBySchema, default: null },
  resolvedAt: { type: Date, default: null },
}, { timestamps: true });

export default mongoose.models.Ticket || mongoose.model<ITicket>('Ticket', TicketSchema);
