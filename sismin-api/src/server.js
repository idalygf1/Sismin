import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.js';
import './utils/dateUtils.js';
const PORT = process.env.PORT || 4000;
await connectDB(process.env.MONGO_URI);
app.listen(PORT, () => console.log(`🚀 http://localhost:${PORT}`));
