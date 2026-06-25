// One-time sync: set every shipment's status to match its batch's status.
// Fixes batches whose status was changed before the cascade existed.
// Idempotent and sends NO WhatsApp messages. Run: node scripts/sync-shipment-status.mjs
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

const SHIPMENT_STATUS = { PENDING: 'PENDING', IN_TRANSIT: 'IN_TRANSIT', LOADING: 'IN_TRANSIT', ARRIVED: 'ARRIVED' };

const uri = process.env.MONGODB_URI;
if (!uri) { console.error('No MONGODB_URI found'); process.exit(1); }

await mongoose.connect(uri);
const Batch = mongoose.connection.collection('batches');
const Shipment = mongoose.connection.collection('shipments');

const batches = await Batch.find({}).toArray();
let total = 0;
for (const b of batches) {
  const mapped = SHIPMENT_STATUS[b.status];
  if (!mapped) { console.log(`skip ${b.batchId} (status ${b.status})`); continue; }
  const res = await Shipment.updateMany(
    { batch: b.batchId, status: { $ne: mapped } },
    { $set: { status: mapped } }
  );
  console.log(`${b.batchId} (${b.status}) -> ${mapped}: ${res.modifiedCount} shipment(s) updated`);
  total += res.modifiedCount;
}
console.log(`Done. ${total} shipment(s) updated across ${batches.length} batch(es).`);
await mongoose.disconnect();
