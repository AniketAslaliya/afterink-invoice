import express from 'express';
import { authenticate } from '../middleware/auth';
import { authorizeOwnerOrAdmin } from '../middleware/auth';
import * as bonusController from '../controllers/bonus';

const router = express.Router();

router.post('/', authenticate, bonusController.createBonus);
router.get('/', authenticate, bonusController.getBonuses);
router.get('/:id', authenticate, bonusController.getBonusById);
router.put('/:id', authenticate, authorizeOwnerOrAdmin(), bonusController.updateBonus);
router.delete('/:id', authenticate, authorizeOwnerOrAdmin(), bonusController.deleteBonus);

export default router; 