import { Router } from 'express';
import { getActivities, getActivityFeed } from '../controllers/activityController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getActivities);
router.get('/feed', authenticate, getActivityFeed);

export default router;

