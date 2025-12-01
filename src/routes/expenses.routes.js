// sismim-api/src/routes/expenses.routes.js
import { Router } from 'express';
import {
  createExpense,
  listExpenses,
  getExpense,
  updateExpense,
  deleteExpense,
} from '../controllers/expenses.controller.js';
import { authJwt } from '../middlewares/authJwt.js'; // 👈 ESTE NOMBRE

const router = Router();

// Todas las rutas de gastos requieren usuario logueado
router.use(authJwt);

// Crear gasto
router.post('/', createExpense);

// Listar gastos con filtros
router.get('/', listExpenses);

// Obtener gasto por ID
router.get('/:id', getExpense);

// Editar gasto
router.put('/:id', updateExpense);

// Eliminar gasto (soft delete)
router.delete('/:id', deleteExpense);

export default router;
