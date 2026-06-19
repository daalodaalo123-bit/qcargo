import 'dotenv/config';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error('MONGODB_URI not set in .env.local');

const AdminUserSchema = new mongoose.Schema({
  username: String,
  email: String,
  passwordHash: String,
  name: String,
  role: String,
  active: Boolean,
}, { timestamps: true });

const AdminUser = mongoose.models.AdminUser || mongoose.model('AdminUser', AdminUserSchema);

async function run() {
  await mongoose.connect(MONGODB_URI);

  const newHash = await bcrypt.hash('qcargo88', 10);
  const result = await AdminUser.updateMany({}, { $set: { passwordHash: newHash } });

  console.log(`Updated ${result.modifiedCount} admin user(s) — new password: qcargo88`);
  await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
