import { Router } from 'express';
import {
  getCompanion,
  updateCompanion,
  feedCompanion,
} from '../controllers/companionController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getCompanion);
router.put('/', authenticate, updateCompanion);
router.post('/feed', authenticate, feedCompanion);

export default router;

