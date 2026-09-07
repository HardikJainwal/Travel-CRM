const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const dbUrl = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/travel_crm';
    const conn = await mongoose.connect(dbUrl);
    console.log(`[DB] Connected to MongoDB via URI: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[DB] Could not connect to MongoDB (${error.message}). Please check DATABASE_URL.`);
    process.exit(1);
  }
};

module.exports = connectDB;
