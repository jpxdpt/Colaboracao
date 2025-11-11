import { Router } from 'express';
import {
  getTeams,
  createTeam,
  joinTeam,
  leaveTeam,
  updateTeam,
  getTeamMessages,
  createTeamMessage,
} from '../controllers/teamController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getTeams);
router.post('/', authenticate, createTeam);
router.put('/:id', authenticate, updateTeam);
router.post('/:id/join', authenticate, joinTeam);
router.post('/:id/leave', authenticate, leaveTeam);
router.get('/:id/messages', authenticate, getTeamMessages);
router.post('/:id/messages', authenticate, createTeamMessage);

export default router;

