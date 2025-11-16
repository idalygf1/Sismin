import { Router } from 'express';
import multer from 'multer';
import {
  createExpense,
  listExpenses,
  getExpense,
  updateExpense,
  deleteExpense
} from '../controllers/expenses.controller.js';
import authJwt from '../middlewares/authJwt.js';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.use(authJwt);

router.post('/', upload.single('file'), createExpense); // con comprobante
router.get('/', listExpenses);
router.get('/:id', getExpense);
router.patch('/:id', updateExpense);
router.delete('/:id', deleteExpense);

export default router;
