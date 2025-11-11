import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@taskify/shared';

const router = Router();

router.get('/', authenticate, authorize(UserRole.ADMIN), getAuditLogs);

export default router;


