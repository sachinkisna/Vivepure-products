import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('MONGODB_URI is not defined in .env');
}

const mongoUri = uri;

const DB_NAME = 'vivepanya';

const DATA_FILE = path.resolve(
  process.cwd(),
  'data',
  'store.json'
);

async function migrate() {
  console.log('🚀 Starting MongoDB migration...');

  if (!fs.existsSync(DATA_FILE)) {
    throw new Error(`store.json not found at: ${DATA_FILE}`);
  }

  const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
  const data = JSON.parse(rawData);
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (
    !adminEmail ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail) ||
    !adminPassword ||
    adminPassword.length < 8 ||
    Buffer.byteLength(adminPassword, 'utf8') > 72
  ) {
    throw new Error('Set a valid ADMIN_EMAIL and ADMIN_PASSWORD before migrating admin credentials.');
  }
  const adminPasswordHash = await bcrypt.hash(adminPassword, 12);

  const client = new MongoClient(mongoUri);

  try {
    await client.connect();

    console.log('✅ Connected to MongoDB Atlas');

    const db = client.db(DB_NAME);

    // Clear existing migrated data
    await db.collection('users').deleteMany({});
    await db.collection('products').deleteMany({});
    await db.collection('categories').deleteMany({});
    await db.collection('orders').deleteMany({});
    await db.collection('reviews').deleteMany({});
    await db.collection('settings').deleteMany({});

    // Insert users
    if (data.users?.length) {
      await db.collection('users').insertMany(data.users);
    }

    // Insert products
    if (data.products?.length) {
      await db.collection('products').insertMany(data.products);
    }

    // Insert categories
    if (data.categories?.length) {
      await db.collection('categories').insertMany(data.categories);
    }

    // Insert orders
    if (data.orders?.length) {
      await db.collection('orders').insertMany(data.orders);
    }

    // Insert reviews
    if (data.reviews?.length) {
      await db.collection('reviews').insertMany(data.reviews);
    }

    await db.collection<{
      _id: string;
      adminEmail: string;
      adminPasswordHash: string;
    }>('settings').insertOne({
      _id: 'admin',
      adminEmail,
      adminPasswordHash,
    });

    console.log('');
    console.log('✅ Migration completed successfully!');
    console.log(`👤 Users: ${data.users?.length ?? 0}`);
    console.log(`📦 Products: ${data.products?.length ?? 0}`);
    console.log(`🏷️ Categories: ${data.categories?.length ?? 0}`);
    console.log(`🛒 Orders: ${data.orders?.length ?? 0}`);
    console.log(`⭐ Reviews: ${data.reviews?.length ?? 0}`);
    console.log(`🔐 Admin settings: ${adminPasswordHash ? 1 : 0}`);
    console.log('');
    console.log('🎉 Data is now in MongoDB Atlas.');
  } finally {
    await client.close();
  }
}

migrate().catch(() => {
  console.error('❌ Migration failed. Check the migration configuration and MongoDB connectivity.');
  process.exit(1);
});