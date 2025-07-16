import express from 'express';
import { authenticate, authorizeOwnerOrAdmin } from '../middleware/auth';
import * as expenseController from '../controllers/expense';

const router = express.Router();

router.post('/', authenticate, expenseController.createExpense);
router.get('/', authenticate, expenseController.getExpenses);
router.get('/:id', authenticate, expenseController.getExpenseById);
router.put('/:id', authenticate, authorizeOwnerOrAdmin(), expenseController.updateExpense);
router.delete('/:id', authenticate, authorizeOwnerOrAdmin(), expenseController.deleteExpense);

export default router; 