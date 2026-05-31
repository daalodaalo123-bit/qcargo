// scripts/clear-db.js
// Run with: npm run clear-db
// This script connects to MongoDB using the URI from .env.local and drops the entire database.

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('❌ MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

(async () => {
  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    console.log(`🗑️  Dropping database: ${db.databaseName}`);
    await db.dropDatabase();
    console.log('✅  Database cleared successfully');
  } catch (err) {
    console.error('❌  Error clearing database:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
