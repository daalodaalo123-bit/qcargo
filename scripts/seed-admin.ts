/**
 * Run once to migrate from hardcoded credentials to DB-based admin users.
 * Usage: npx ts-node scripts/seed-admin.ts
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || '';
if (!MONGODB_URI) throw new Error('MONGODB_URI not set');

const AdminUserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['admin', 'staff'], default: 'admin' },
  active: { type: Boolean, default: true },
}, { timestamps: true });

const AdminUser = mongoose.models.AdminUser || mongoose.model('AdminUser', AdminUserSchema);

async function seed() {
  await mongoose.connect(MONGODB_URI);

  const existing = await AdminUser.findOne({ username: 'admin' });
  if (existing) {
    console.log('Admin user already exists — skipping seed.');
    await mongoose.disconnect();
    return;
  }

  const hash = await bcrypt.hash('durdur2024', 10);
  await AdminUser.create({
    username: 'admin',
    email: 'admin@qcargo.com',
    passwordHash: hash,
    name: 'Admin Agent',
    role: 'admin',
    active: true,
  });

  console.log('Admin user created: username=admin password=durdur2024');
  await mongoose.disconnect();
}

seed().catch((e) => { console.error(e); process.exit(1); });
