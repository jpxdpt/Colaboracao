import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  changePassword,
  getUsers,
  updateUserRole,
  resetUserPassword,
  exportUsersCsv,
  exportMyData,
  deleteMyAccount,
} from '../controllers/authController';
import { authenticate, authorize } from '../middleware/auth';
import expressRateLimit from 'express-rate-limit';
import { UserRole } from '@taskify/shared';

const router = Router();

// Rate limiting mais restritivo para login e registo
const authLimiter = expressRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 tentativas por IP
  message: 'Muitas tentativas. Tente novamente mais tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rotas públicas
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh', refreshToken);

// Rotas protegidas
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getProfile);
router.put('/change-password', authenticate, changePassword);
router.get('/users/export/csv', authenticate, authorize(UserRole.ADMIN), exportUsersCsv);
router.get('/users', authenticate, authorize(UserRole.ADMIN), getUsers);
router.patch('/users/:id/role', authenticate, authorize(UserRole.ADMIN), updateUserRole);
router.post('/users/:id/reset-password', authenticate, authorize(UserRole.ADMIN), resetUserPassword);
router.get('/me/export', authenticate, exportMyData);
router.delete('/me', authenticate, deleteMyAccount);

export default router;


