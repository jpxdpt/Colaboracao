import { Router } from 'express';
import {
  getGoals,
  getGoalById,
  createGoal,
  updateGoal,
  deleteGoal,
} from '../controllers/goalController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getGoals);
router.get('/:id', authenticate, getGoalById);
router.post('/', authenticate, createGoal);
router.put('/:id', authenticate, updateGoal);
router.delete('/:id', authenticate, deleteGoal);

export default router;

