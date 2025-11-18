// sismin-api/src/routes/expenses.routes.js
import { Router } from 'express';
import {
  createExpense,
  listExpenses,
  getExpense,
  updateExpense,
  deleteExpense,
} from '../controllers/expenses.controller.js';

const router = Router();

// Crear gasto con comprobante
router.post('/', createExpense);

// Listar gastos con filtros
router.get('/', listExpenses);

// Obtener gasto por ID
router.get('/:id', getExpense);

// Editar gasto
router.put('/:id', updateExpense);

// Eliminar gasto (soft delete)
router.delete('/:id', deleteExpense);

// 👇 Esto es lo que faltaba
export default router;
