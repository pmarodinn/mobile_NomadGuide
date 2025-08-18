import express from 'express';
import {
  getBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetStatistics
} from '../controllers/budgetController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All budget routes require authentication
router.use(authenticateToken);

// Budget CRUD operations
router.get('/', getBudgets);
router.get('/stats', getBudgetStatistics);
router.get('/:id', getBudgetById);
router.post('/', createBudget);
router.put('/:id', updateBudget);
router.delete('/:id', deleteBudget);

export default router;
