const mongoose = require('mongoose');

const connectDB = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 45000,
      });
      console.log(`✅ MongoDB connected: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      console.error(`⚠️  MongoDB connection attempt ${i + 1}/${retries} failed: ${error.message}`);
      if (i < retries - 1) {
        console.log('⏳ Retrying MongoDB connection in 2s...');
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } else {
        console.error('❌ Could not establish MongoDB Atlas connection. Please verify your internet connection or MongoDB Atlas IP whitelist (0.0.0.0/0).');
        process.exit(1);
      }
    }
  }
};

module.exports = connectDB;
