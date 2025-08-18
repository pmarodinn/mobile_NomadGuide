import express from 'express';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/categoryController';
import { authenticateToken, optionalAuth } from '../middleware/auth';

const router = express.Router();

// Public routes (categories can be viewed by anyone)
router.get('/', optionalAuth, getCategories);
router.get('/:id', optionalAuth, getCategoryById);

// Protected routes (require authentication)
router.post('/', authenticateToken, createCategory);
router.put('/:id', authenticateToken, updateCategory);
router.delete('/:id', authenticateToken, deleteCategory);

export default router;
