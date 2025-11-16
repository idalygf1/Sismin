import mongoose from 'mongoose';
export async function connectDB(uri) {
  await mongoose.connect(uri, { dbName: 'sismin' });
  console.log('✅ Mongo conectado');
}
