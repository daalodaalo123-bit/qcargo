import mongoose, { Document, Schema } from 'mongoose';

export interface ITodoTask extends Document {
  title: string;
  assignee: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'In Progress' | 'Completed';
  dueDate: string;
}

const TodoTaskSchema = new Schema<ITodoTask>({
  title: { type: String, required: true },
  assignee: { type: String, required: true },
  priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
  status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' },
  dueDate: { type: String, required: true },
}, { timestamps: true });

export default mongoose.models.TodoTask || mongoose.model<ITodoTask>('TodoTask', TodoTaskSchema);
