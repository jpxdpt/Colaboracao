import { Router } from 'express';
import {
  getCurrencyBalance,
  getCurrencyHistory,
  convertPoints,
} from '../controllers/currencyController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getCurrencyBalance);
router.get('/history', authenticate, getCurrencyHistory);
router.post('/convert', authenticate, convertPoints);

export default router;

