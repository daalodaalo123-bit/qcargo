// scripts/clear-db.ts
// Run with: npx ts-node scripts/clear-db.ts
// This script connects to the MongoDB instance defined in MONGODB_URI
// and drops the entire database, effectively removing all collections and data.
// Use with caution – it is destructive and cannot be undone.

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('❌ MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

async function clearDatabase() {
  try {
    await mongoose.connect(uri!);
    const db = mongoose.connection.db;
    if (db) {
      console.log(`🗑️  Dropping database: ${db.databaseName}`);
      await db.dropDatabase();
      console.log('✅  Database cleared successfully');
    } else {
      console.error('❌  No database instance found.');
    }
  } catch (err) {
    console.error('❌  Error clearing database:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

clearDatabase();
