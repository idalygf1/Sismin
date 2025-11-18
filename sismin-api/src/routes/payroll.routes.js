import { Router } from 'express';
import { authJwt } from '../middlewares/authJwt.js';
import {
  createPayroll,
  listPayroll,
  getPayroll,
  updatePayroll,
  deletePayroll
} from '../controllers/payroll.controller.js';

const router = Router();

router.use(authJwt);

router.post('/', createPayroll);
router.get('/', listPayroll);
router.get('/:id', getPayroll);
router.patch('/:id', updatePayroll);
router.delete('/:id', deletePayroll);

export default router;