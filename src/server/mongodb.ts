import dns from 'dns';
import 'dotenv/config';
import { MongoClient, Db } from 'mongodb';

const nodeMajor = Number.parseInt(process.versions.node.split('.')[0], 10);
const uri = process.env.MONGODB_URI?.trim();

if (uri?.startsWith('mongodb+srv://') && process.platform === 'win32') {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
  console.log('[MongoDB] Using public DNS servers for MongoDB Atlas SRV resolution.');
}

if (uri?.startsWith('mongodb+srv://') && nodeMajor >= 24) {
  console.warn(
    `[MongoDB] Node ${process.version} has known OpenSSL/TLS incompatibilities with some MongoDB Atlas deployments; use Node 22.x if the Atlas handshake fails with ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR.`
  );
}

const client = new MongoClient(uri ?? '', {
  serverSelectionTimeoutMS: 15000,
});

let db: Db | null = null;

export async function connectMongoDB(): Promise<Db> {
  if (!uri) {
    throw new Error(
      'MONGODB_URI is not defined in .env. Set it to your local MongoDB URL or MongoDB Atlas URI.'
    );
  }

  if (db) {
    return db;
  }

  await client.connect();

  db = client.db('vivepanya');

  console.log('✅ Connected to MongoDB Atlas');

  return db;
}

export async function getMongoDB(): Promise<Db> {
  if (db) {
    return db;
  }

  return connectMongoDB();
}