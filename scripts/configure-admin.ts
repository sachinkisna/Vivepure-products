import 'dotenv/config';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const uri = process.env.MONGODB_URI?.trim();
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

if (!uri) {
  throw new Error('MONGODB_URI is required.');
}
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
  throw new Error('Set a valid ADMIN_EMAIL and a unique ADMIN_PASSWORD of 8 to 72 UTF-8 bytes.');
}
const mongoUri = uri;
const adminEmail = email;
const adminPassword = password;

async function configureAdmin() {
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    const adminPasswordHash = await bcrypt.hash(adminPassword, 12);
    await client.db('vivepanya').collection<{
      _id: string;
      adminEmail: string;
      adminPasswordHash: string;
    }>('settings').updateOne(
      { _id: 'admin' },
      { $set: { adminEmail, adminPasswordHash } },
      { upsert: true }
    );
    console.log('Administrator credentials updated in MongoDB.');
  } finally {
    await client.close();
  }
}

configureAdmin().catch(() => {
  console.error('Failed to configure administrator credentials. Check the server environment and MongoDB connectivity.');
  process.exitCode = 1;
});
