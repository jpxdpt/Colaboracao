import { Router } from 'express';
import {
  getRewards,
  getRewardById,
  redeemReward,
  getRedemptions,
} from '../controllers/rewardController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getRewards);
router.get('/redemptions', authenticate, getRedemptions);
router.get('/:id', authenticate, getRewardById);
router.post('/:id/redeem', authenticate, redeemReward);

export default router;

