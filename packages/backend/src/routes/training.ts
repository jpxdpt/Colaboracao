import { Router } from 'express';
import {
  getTrainings,
  getTrainingById,
  getTrainingProgress,
  startTraining,
  updateTrainingProgress,
} from '../controllers/trainingController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getTrainings);
router.get('/progress', authenticate, getTrainingProgress);
router.get('/:id', authenticate, getTrainingById);
router.post('/:id/start', authenticate, startTraining);
router.put('/:id/progress', authenticate, updateTrainingProgress);

export default router;

