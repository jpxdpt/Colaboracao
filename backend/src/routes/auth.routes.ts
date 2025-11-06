import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Rate limiting para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
});

// Rate limiting para registo
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // 3 registos
  message: 'Muitas tentativas de registo. Tente novamente em 1 hora.',
});

// Gerar token JWT
const generateToken = (userId: string, email: string, role: string): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET não configurado');
  }
  return jwt.sign(
    { userId, email, role },
    jwtSecret,
    { expiresIn: '7d' }
  );
};

// Registro
router.post(
  '/register',
  registerLimiter,
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('Password deve ter pelo menos 6 caracteres'),
    body('name').trim().notEmpty().withMessage('Nome é obrigatório'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, name } = req.body;
      
      // Normalizar email para lowercase (consistente com o schema)
      const normalizedEmail = email.toLowerCase().trim();

      // Verificar se email já existe
      const existingUser = await User.findOne({ email: normalizedEmail });

      if (existingUser) {
        return res.status(400).json({ error: 'Email já registado' });
      }

      // Hash da password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Criar utilizador (por padrão é 'user', admin pode ser criado manualmente)
      const user = await User.create({
        email: normalizedEmail,
        password_hash: passwordHash,
        name: name.trim(),
        role: 'user',
      });

      const token = generateToken(String(user._id), user.email, user.role);

      res.status(201).json({
        message: 'Utilizador criado com sucesso',
        token,
        user: {
          id: String(user._id),
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error: any) {
      console.error('Register error:', error);
      if (error.code === 11000) {
        return res.status(400).json({ error: 'Email já registado' });
      }
      res.status(500).json({ error: 'Erro ao criar utilizador' });
    }
  }
);

// Login
router.post(
  '/login',
  loginLimiter,
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('Password é obrigatória'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;
      
      // Normalizar email para lowercase (consistente com o schema)
      const normalizedEmail = email.toLowerCase().trim();

      // Buscar utilizador
      const user = await User.findOne({ email: normalizedEmail });

      if (!user) {
        console.log(`Login falhou: utilizador não encontrado - ${normalizedEmail}`);
        return res.status(401).json({ error: 'Email ou password incorretos' });
      }

      // Verificar password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        console.log(`Login falhou: password incorreta para - ${normalizedEmail}`);
        return res.status(401).json({ error: 'Email ou password incorretos' });
      }
      
      console.log(`Login bem-sucedido: ${normalizedEmail}`);

      const token = generateToken(String(user._id), user.email, user.role);

      res.json({
        message: 'Login bem-sucedido',
        token,
        user: {
          id: String(user._id),
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Erro ao fazer login' });
    }
  }
);

// Verificar token atual
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.user!.userId).select('-password_hash');

    if (!user) {
      return res.status(404).json({ error: 'Utilizador não encontrado' });
    }

    res.json({
      user: {
        id: String(user._id),
        email: user.email,
        name: user.name,
        role: user.role,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({ error: 'Erro ao buscar utilizador' });
  }
});

export default router;
