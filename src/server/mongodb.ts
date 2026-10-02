import 'dotenv/config';
import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('MONGODB_URI is not defined in .env');
}

const client = new MongoClient(uri);

let db: Db | null = null;

export async function connectMongoDB(): Promise<Db> {
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