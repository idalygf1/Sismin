// src/app.js
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

// Rutas
import authRoutes from './routes/auth.routes.js';
import concessionsRoutes from './routes/concessions.routes.js';
import employeesRoutes from './routes/employees.routes.js';
import simpleDocsRoutes from './routes/simpledocs.routes.js';
import expensesRoutes from './routes/expenses.routes.js';
import payrollRoutes from './routes/payroll.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import userRoutes from './routes/userRoutes.js';

// -------------------------------------------------------------------
// Resolver __dirname en ES Modules
// -------------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -------------------------------------------------------------------
// Crear app
// -------------------------------------------------------------------
const app = express();

// Middlewares base
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// -------------------------------------------------------------------
// ✅ Carpeta estática para los archivos subidos
//    Ejemplo: https://sismin.onrender.com/uploads/archivo.pdf
// -------------------------------------------------------------------
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// -------------------------------------------------------------------
// Rutas API
// -------------------------------------------------------------------
app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/concessions', concessionsRoutes);

// Empleados
app.use('/api/employees', employeesRoutes);

// Documentos simples (subir cualquier archivo)
app.use('/api/simpledocs', simpleDocsRoutes);

app.use('/api/expenses', expensesRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/auth/users', userRoutes);

export default app;
