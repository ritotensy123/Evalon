const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://ritotensy:redriders@evalon.u8jqfbo.mongodb.net/?retryWrites=true&w=majority&appName=Evalon';
    const conn = await mongoose.connect(mongoUri, {
      dbName: 'evalon'
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

    return conn;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    throw error; // Don't exit, let the caller handle it
  }
};

module.exports = connectDB;



