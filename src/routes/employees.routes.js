// src/routes/employees.routes.js
import { Router } from 'express';
import { authJwt } from '../middlewares/authJwt.js';
import {
  createEmployee,
  listEmployees,
  getEmployee,
  updateEmployee,
  removeEmployee,
} from '../controllers/employees.controller.js';

const router = Router();

router.use(authJwt);

router.post('/', createEmployee);
router.get('/', listEmployees);
router.get('/:id', getEmployee);
router.patch('/:id', updateEmployee);
router.delete('/:id', removeEmployee);

export default router;
