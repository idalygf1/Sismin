import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes.js';
import concessionsRoutes from './routes/concessions.routes.js';
import employeesRoutes from './routes/employees.routes.js';
import empDocsRoutes from './routes/empdocs.routes.js';
import expensesRoutes from './routes/expenses.routes.js';
import payrollRoutes from './routes/payroll.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import userRoutes from './routes/userRoutes.js';

const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/concessions', concessionsRoutes);
app.use('/api/employees', employeesRoutes);     // empleados
app.use('/api/empdocs', empDocsRoutes);         // documentos de empleado
app.use('/api/employees', empDocsRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/auth/users', userRoutes);
export default app;

import path from 'path';
import { fileURLToPath } from 'url';

// 👇 esto es para poder usar __dirname con ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Carpeta estática para los archivos subidos
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
