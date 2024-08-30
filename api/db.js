const { MongoClient } = require('mongodb');
require("dotenv").config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.DBNAME;

if (!uri.startsWith("mongodb+srv://") && !uri.startsWith("mongodb://")) {
  console.error('Invalid MongoDB URI scheme. The URI must start with "mongodb+srv://" or "mongodb://".');
  process.exit(1);
}

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
let db;

async function connectToMongo() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    db = client.db(dbName);
  } catch (error) {
    console.error('Failed to connect to MongoDB', error.message);
    process.exit(1);
  }
}

function getDb() {
  if (!db) {
    throw new Error('Database not connected');
  }
  return db;
}

async function closeConnection() {
    try {
      await client.close();
      console.log('MongoDB connection closed');
    } catch (error) {
      console.error('Failed to close MongoDB connection', error.message);
    }
  }

module.exports = { connectToMongo, getDb, closeConnection };
