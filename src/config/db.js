// src/config/db.js
import mongoose from 'mongoose';

const connectDB = async (uri) => {
  try {
    if (!uri) {
      throw new Error('MONGO_URI no fue proporcionado');
    }

    await mongoose.connect(uri, {
      dbName: 'sismin',
    });

    console.log('✅ Mongo conectado');
  } catch (err) {
    console.error('❌ Error conectando a Mongo:', err.message);
    throw err;
  }
};

export default connectDB;
