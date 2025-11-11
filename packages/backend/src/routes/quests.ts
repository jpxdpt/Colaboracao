import { Router } from 'express';
import {
  getQuests,
  getQuestById,
  startQuest,
  updateQuestProgress,
} from '../controllers/questController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getQuests);
router.get('/:id', authenticate, getQuestById);
router.post('/:id/start', authenticate, startQuest);
router.put('/:id/progress', authenticate, updateQuestProgress);

export default router;

