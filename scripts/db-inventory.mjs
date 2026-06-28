// READ-ONLY database inventory. Lists every collection, its document count,
// and a compact preview of each doc so we can spot demo/fake data.
// Makes NO changes. Run: node scripts/db-inventory.mjs
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
const collections = await db.listCollections().toArray();
collections.sort((a, b) => a.name.localeCompare(b.name));

const pick = (d) => {
  // keep a few human-meaningful fields if present
  const keys = ['customer','customerName','vendor','name','shipmentNumber','batchId','invoiceNumber','goods','price','amount','total','totalAmount','phone','date','status','createdAt','createdBy'];
  const out = {};
  for (const k of keys) if (d[k] !== undefined) out[k] = d[k] && d[k].name ? d[k].name : d[k];
  out._id = String(d._id);
  return out;
};

for (const c of collections) {
  const col = db.collection(c.name);
  const count = await col.countDocuments();
  console.log(`\n===== ${c.name}  (${count} docs) =====`);
  if (count === 0) continue;
  const docs = await col.find({}).limit(60).toArray();
  for (const d of docs) console.log(JSON.stringify(pick(d)));
}

await mongoose.disconnect();
console.log('\n[read-only — no changes made]');
