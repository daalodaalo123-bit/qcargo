import mongoose, { Document, Schema } from 'mongoose';

export interface ITodoPerson extends Document {
  name: string;
}

const TodoPersonSchema = new Schema<ITodoPerson>(
  {
    name: { type: String, required: true, unique: true, trim: true },
  },
  { timestamps: true }
);

export default mongoose.models.TodoPerson || mongoose.model<ITodoPerson>('TodoPerson', TodoPersonSchema);
