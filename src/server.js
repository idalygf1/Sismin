// src/server.js
import 'dotenv/config';
import app from './app.js';
import connectDB from './config/db.js';
import './utils/dateUtils.js';

const PORT = process.env.PORT || 4000;

// Verificación de la variable de entorno
if (!process.env.MONGO_URI) {
  console.error('❌ MONGO_URI no está definido en el archivo .env');
  process.exit(1);
}

(async () => {
  try {
    await connectDB(process.env.MONGO_URI);

    app.listen(PORT, () => {
      console.log(`🚀 Servidor escuchando en el puerto ${PORT}`);
    });

  } catch (err) {
    console.error('❌ No se pudo iniciar el servidor:', err.message);
    process.exit(1);
  }
})();
