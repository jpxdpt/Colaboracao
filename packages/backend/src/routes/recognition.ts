import { Router } from 'express';
import {
  getRecognitionFeed,
  sendRecognition,
} from '../controllers/recognitionController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getRecognitionFeed);
router.post('/', authenticate, sendRecognition);

export default router;

