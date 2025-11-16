import express from 'express';
import {
  getUsers,
  updateUser,
  updateUserStatus
} from '../controllers/userController.js';

const router = express.Router();

// GET /api/auth/users
router.get('/', getUsers);

// PATCH /api/auth/users/:id
router.patch('/:id', updateUser);

// PATCH /api/auth/users/:id/status
router.patch('/:id/status', updateUserStatus);

export default router;
