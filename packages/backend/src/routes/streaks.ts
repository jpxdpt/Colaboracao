import { Router } from 'express';
import {
  getUserStreaksHandler,
  getStreakByType,
} from '../controllers/streakController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getUserStreaksHandler);
router.get('/:type', authenticate, getStreakByType);

export default router;

