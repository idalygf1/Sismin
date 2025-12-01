import { Router } from 'express';
import { authJwt } from '../middlewares/authJwt.js';
import { getOverview } from '../controllers/dashboard.controller.js';

const router = Router();

router.use(authJwt);

// GET /api/dashboard/overview
router.get('/overview', getOverview);

export default router;
