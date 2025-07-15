import express from 'express';
import { authenticate } from '../middleware/auth';
import * as expenseReasonController from '../controllers/expenseReason';

const router = express.Router();

router.post('/', authenticate, expenseReasonController.createExpenseReason);
router.get('/', authenticate, expenseReasonController.getExpenseReasons);
router.get('/:id', authenticate, expenseReasonController.getExpenseReasonById);
router.put('/:id', authenticate, expenseReasonController.updateExpenseReason);
router.delete('/:id', authenticate, expenseReasonController.deleteExpenseReason);

export default router; 