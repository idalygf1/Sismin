import { Router } from 'express';
import { register, login, assignConcessionToUser } from '../controllers/auth.controller.js';
import { authJwt } from '../middlewares/authJwt.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/assign-concession', authJwt, assignConcessionToUser);

export default router;
