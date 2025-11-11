import { Router } from 'express';
import {
  getChallenges,
  getChallengeById,
  joinChallenge,
  getChallengeProgress,
  joinTeamToChallengeHandler,
  getTeamChallengeRanking,
  getTeamChallengeProgress,
  createChallenge,
  distributeRewardsHandler,
} from '../controllers/challengeController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@gamify/shared';

const router = Router();

router.get('/', authenticate, getChallenges);
router.post('/', authenticate, authorize(UserRole.ADMIN), createChallenge);
router.get('/:id', authenticate, getChallengeById);
router.get('/:id/progress', authenticate, getChallengeProgress);
router.post('/:id/join', authenticate, joinChallenge);
router.post('/:id/distribute-rewards', authenticate, authorize(UserRole.ADMIN), distributeRewardsHandler);

// Rotas de equipas
router.post('/:id/teams/join', authenticate, joinTeamToChallengeHandler);
router.get('/:id/teams/ranking', authenticate, getTeamChallengeRanking);
router.get('/:id/teams/:teamId/progress', authenticate, getTeamChallengeProgress);

export default router;

