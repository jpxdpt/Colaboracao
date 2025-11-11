import { Router } from 'express';
import {
  getUserPoints,
  getPointsHistoryHandler,
  getAllBadges,
  getUserBadgesHandler,
  getAllLevels,
  getLevelProgressHandler,
  getGamificationConfig,
} from '../controllers/gamificationController';
import {
  getSocialBadges,
  giveSocialBadge,
  getUserSocialBadges,
} from '../controllers/socialBadgeController';
import {
  getRankings,
  getUserRanking,
  getTopRankings,
} from '../controllers/rankingController';
import { authenticate } from '../middleware/auth';
import streakRoutes from './streaks';
import currencyRoutes from './currency';
import challengeRoutes from './challenges';
import teamRoutes from './teams';
import rewardRoutes from './rewards';

const router = Router();

// Pontos
router.get('/points', authenticate, getUserPoints);
router.get('/points/history', authenticate, getPointsHistoryHandler);

// Badges
router.get('/badges', authenticate, getAllBadges);
router.get('/badges/user', authenticate, getUserBadgesHandler);
router.get('/badges/social', authenticate, getSocialBadges);
router.get('/badges/user/:userId/social', authenticate, getUserSocialBadges);
router.post('/badges/:badgeId/give', authenticate, giveSocialBadge);

// Níveis
router.get('/levels', authenticate, getAllLevels);
router.get('/levels/progress', authenticate, getLevelProgressHandler);

// Rankings
router.get('/rankings', authenticate, getRankings);
router.get('/rankings/user', authenticate, getUserRanking);
router.get('/rankings/top', authenticate, getTopRankings);

// Streaks
router.use('/streaks', streakRoutes);

// Currency
router.use('/currency', currencyRoutes);

// Challenges
router.use('/challenges', challengeRoutes);

// Teams
router.use('/teams', teamRoutes);

// Rewards
router.use('/rewards', rewardRoutes);

// Configuração (admin)
router.get('/config', authenticate, getGamificationConfig);

export default router;

