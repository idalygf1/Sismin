import { Router } from 'express';
import { authJwt } from '../middlewares/authJwt.js';
import {
  listNotifications,
  createNotification,
  markNotificationRead,
  deleteNotification
} from '../controllers/notifications.controller.js';

const router = Router();
router.use(authJwt);

router.get('/', listNotifications);
router.post('/', createNotification);
router.patch('/:id/read', markNotificationRead);
router.delete('/:id', deleteNotification);

export default router;