import express from 'express';
import { authenticate } from '../middleware/auth';
import * as expenseController from '../controllers/expense';

const router = express.Router();

router.post('/', authenticate, expenseController.createExpense);
router.get('/', authenticate, expenseController.getExpenses);
router.get('/:id', authenticate, expenseController.getExpenseById);
router.put('/:id', authenticate, expenseController.updateExpense);
router.delete('/:id', authenticate, expenseController.deleteExpense);

export default router; 