// One-time backfill: credit existing quotations (with no createdBy) to the Owner.
// So the HR scoreboard / "By X" labels are never blank for legacy data.
// Idempotent — only touches docs missing a createdBy.id. Run: node scripts/backfill-created-by.mjs
import fs from 'fs';
import mongoose from 'mongoose';

// Load MONGODB_URI from .env.local, tolerating a UTF-8 BOM and CRLF endings.
if (!process.env.MONGODB_URI && fs.existsSync('.env.local')) {
  const raw = fs.readFileSync('.env.local', 'utf8').replace(/^﻿/, '');
  for (const line of raw.split(/\r?\n/)) {
    const clean = line.replace(/^﻿/, '').trim();
    if (clean.startsWith('MONGODB_URI=')) {
      process.env.MONGODB_URI = clean.slice('MONGODB_URI='.length).replace(/^["']|["']$/g, '');
      break;
    }
  }
}

const uri = process.env.MONGODB_URI;
if (!uri) { console.error('No MONGODB_URI found'); process.exit(1); }

await mongoose.connect(uri);

const AdminUser = mongoose.connection.collection('adminusers');
const Quotation = mongoose.connection.collection('quotations');

// Find the Owner (Super Admin). Prefer the oldest admin account.
const owner = await AdminUser.find({ role: 'admin' }).sort({ createdAt: 1 }).limit(1).toArray();
if (!owner.length) { console.error('No admin/owner user found — cannot backfill.'); process.exit(1); }
const o = owner[0];
const createdBy = { id: String(o._id), name: o.name || 'Owner' };
console.log(`Owner: ${createdBy.name} (${createdBy.id})`);

const res = await Quotation.updateMany(
  { $or: [{ createdBy: { $exists: false } }, { createdBy: null }, { 'createdBy.id': { $in: [null, ''] } }] },
  { $set: { createdBy } }
);
console.log(`Backfilled ${res.modifiedCount} quotation(s) to Owner.`);

await mongoose.disconnect();
console.log('Done.');
