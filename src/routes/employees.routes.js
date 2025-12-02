// src/routes/employees.routes.js
import { Router } from 'express';
import { authJwt } from '../middlewares/authJwt.js';
import {
  createEmployee,
  listEmployees,
  listEmployeesForDocs,
  getEmployee,
  updateEmployee,
  removeEmployee,
} from '../controllers/employees.controller.js';

const router = Router();

router.use(authJwt);

// Crear empleado
router.post('/', createEmployee);

// Lista principal (pantalla de Empleados)
router.get('/', listEmployees);

// 🔹 Lista para combos en Documentos: /employees/list
router.get('/list', listEmployeesForDocs);

// Obtener, actualizar y eliminar por id
router.get('/:id', getEmployee);
router.patch('/:id', updateEmployee);
router.delete('/:id', removeEmployee);

export default router;
