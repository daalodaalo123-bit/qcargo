// lib/mongoose.ts
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const getUri = () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI not defined');
  }
  return uri;
};

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return; // already connected
  try {
    const uri = getUri();
    await mongoose.connect(uri);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error', err);
    throw err;
  }
};

export default mongoose;
