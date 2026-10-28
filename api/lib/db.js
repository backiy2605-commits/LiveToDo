let MongoClient;
try {
  MongoClient = require('mongodb').MongoClient;
} catch (e) {
  MongoClient = null;
}

const uri = process.env.MONGODB_URI;
let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (!uri || !MongoClient) {
    return { client: null, db: null };
  }

  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  try {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    const db = client.db('livetodo');

    cachedClient = client;
    cachedDb = db;
    return { client, db };
  } catch (err) {
    console.warn('MongoDB connection error:', err.message);
    return { client: null, db: null };
  }
}

module.exports = { connectToDatabase };
