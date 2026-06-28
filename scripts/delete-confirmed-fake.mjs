// Deletes ONLY the three confirmed-fake categories. Nothing financial is touched.
// Run: node scripts/delete-confirmed-fake.mjs
import fs from 'fs';
import mongoose from 'mongoose';

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
const db = mongoose.connection.db;

const r1 = await db.collection('leads').deleteMany({ name: 'Test Lead Verify' });
console.log(`Deleted ${r1.deletedCount} 'Test Lead Verify' lead(s).`);

const r2 = await db.collection('leadmetrics').deleteMany({});
console.log(`Deleted ${r2.deletedCount} seeded lead-metric(s).`);

const r3 = await db.collection('typingstatuses').deleteMany({});
console.log(`Deleted ${r3.deletedCount} stale typing-status flag(s).`);

await mongoose.disconnect();
console.log('Done. No financial data touched.');
