import { Router } from 'express';
import { getUserKPIsHandler } from '../controllers/kpiController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getUserKPIsHandler);

export default router;

