import jwt, { Secret } from 'jsonwebtoken';
import { config } from '../config';
import { User, IUser } from '../models/User';
import { AppError } from '../middleware/errorHandler';
import { getRedisClient, isRedisAvailable } from '../config/redis';
import { logger } from '../utils/logger';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Gera tokens JWT (access e refresh)
 */
export const generateTokens = (user: IUser): AuthTokens => {
  const payload: TokenPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  const jwtSecret: Secret | string = config.jwt.secret as string;

  const accessToken = jwt.sign(payload, jwtSecret, {
    expiresIn: config.jwt.accessExpiresIn as jwt.SignOptions['expiresIn'],
  });

  const refreshToken = jwt.sign(payload, jwtSecret, {
    expiresIn: config.jwt.refreshExpiresIn as jwt.SignOptions['expiresIn'],
  });

  return { accessToken, refreshToken };
};

/**
 * Adiciona token à blacklist (Redis)
 */
export const blacklistToken = async (token: string, expiresIn: string): Promise<void> => {
  if (!isRedisAvailable()) {
    // Se Redis não estiver disponível, apenas logar
    return;
  }

  try {
    const redis = getRedisClient();
    if (redis) {
      // Converter expiresIn (ex: "15m") para segundos
      const expiresInSeconds = parseExpiresIn(expiresIn);
      await redis.setex(`blacklist:${token}`, expiresInSeconds, '1');
    }
  } catch (error) {
    // Não falhar se não conseguir adicionar à blacklist
    logger.warn('Falha ao adicionar token à blacklist (continuando)', {
      error: error instanceof Error ? error.message : 'Unknown error',
      tokenPrefix: token.substring(0, 10) + '...'
    });
  }
};

/**
 * Verifica se token está na blacklist
 */
export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  // Se Redis não estiver disponível, nenhum token está blacklisted
  if (!isRedisAvailable()) {
    return false;
  }

  try {
    const redis = getRedisClient();
    if (redis && redis.status === 'ready') {
      const result = await redis.get(`blacklist:${token}`);
      return result === '1';
    }
  } catch (error) {
    // Se houver qualquer erro (Redis não disponível, timeout, etc), 
    // assumir que o token não está blacklisted para não bloquear autenticação
    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      logger.warn('Erro ao verificar blacklist (continuando sem Redis)', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tokenPrefix: token.substring(0, 10) + '...'
      });
    }
  }

  // Por padrão, retornar false (token não está blacklisted)
  return false;
};

/**
 * Converte expiresIn string para segundos
 */
const parseExpiresIn = (expiresIn: string): number => {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) {
    return 3600; // Default 1 hora
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 24 * 60 * 60;
    default:
      return 3600;
  }
};

/**
 * Verifica e decodifica refresh token
 */
export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as TokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError('Refresh token expirado', 401);
    }
    throw new AppError('Refresh token inválido', 401);
  }
};

