// src/config/db.js
import mongoose from 'mongoose';

export async function connectDB(uri) {
  try {
    if (!uri) {
      throw new Error('MONGO_URI no fue proporcionado');
    }

    await mongoose.connect(uri, {
      // Puedes dejar que tome el dbName del string, pero si quieres forzar:
      dbName: 'sismin',
    });

    console.log('✅ Mongo conectado');
  } catch (err) {
    console.error('❌ Error conectando a Mongo:', err.message);
    throw err;
  }
}
