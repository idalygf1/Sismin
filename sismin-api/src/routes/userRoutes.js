import express from 'express';
import { authJwt } from '../middlewares/authJwt.js';
import {
  getUsers,
  getProfile,
  updateUser,
  updateUserStatus
} from '../controllers/userController.js';

const router = express.Router();
router.use(authJwt);

// GET /api/auth/users
router.get('/', getUsers);

// PATCH /api/auth/users/:id
router.get('/me', getProfile);
router.patch('/:id', updateUser);

// PATCH /api/auth/users/:id/status
router.patch('/:id/status', updateUserStatus);

export default router;