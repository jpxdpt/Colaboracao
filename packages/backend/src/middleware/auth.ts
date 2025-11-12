import { Request, Response, NextFunction } from 'express';
import { HydratedDocument } from 'mongoose';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { User, IUser } from '../models/User';
import { AppError } from './errorHandler';
import { isTokenBlacklisted } from '../services/authService';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  user?: HydratedDocument<IUser>;
}

/**
 * Middleware de autenticação JWT
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    // Log para debug (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Auth middleware request', {
        hasAuthHeader: !!authHeader,
        path: req.path,
        method: req.method,
        ip: req.ip
      });
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Token não fornecido ou formato inválido', {
        path: req.path,
        method: req.method,
        ip: req.ip
      });
      throw new AppError('Token de autenticação não fornecido', 401);
    }

    const token = authHeader.substring(7);
    // Log apenas informações não sensíveis

    // Verificar se token está na blacklist (ignorar erros se Redis não estiver disponível)
    try {
      const blacklisted = await isTokenBlacklisted(token);
      if (blacklisted) {
        throw new AppError('Token revogado', 401);
      }
    } catch (error) {
      // Se houver erro ao verificar blacklist (ex: Redis não disponível), continuar com autenticação
      // Apenas logar o erro, mas não falhar a autenticação
      if (error instanceof AppError && error.message === 'Token revogado') {
        throw error; // Re-lançar se realmente estiver blacklisted
      }
      // Ignorar outros erros (como Redis não disponível)
    }

    // Verificar e decodificar token
    let decoded: { userId: string };
    try {
      decoded = jwt.verify(token, config.jwt.secret) as { userId: string };
      if (process.env.NODE_ENV === 'development') {
        logger.debug('Token JWT válido', { userId: decoded.userId });
      }
    } catch (jwtError) {
      logger.error('Erro ao verificar token JWT', {
        error: jwtError instanceof Error ? jwtError.message : 'Unknown error',
        errorType: jwtError instanceof jwt.JsonWebTokenError ? 'JsonWebTokenError' :
                   jwtError instanceof jwt.TokenExpiredError ? 'TokenExpiredError' : 'Other',
        path: req.path,
        ip: req.ip
      });
      throw jwtError;
    }

    // Buscar utilizador (sem password para melhor performance)
    const user = await User.findById(decoded.userId);

    if (!user) {
      logger.error('Utilizador não encontrado para token válido', {
        userId: decoded.userId,
        path: req.path,
        ip: req.ip
      });
      throw new AppError('Utilizador não encontrado', 401);
    }

    if (user.isDeleted) {
      logger.warn('Tentativa de autenticação com conta eliminada', {
        userId: user._id,
        email: user.email,
        path: req.path,
        ip: req.ip
      });
      throw new AppError('Conta desativada. Contacte o suporte.', 403);
    }

    if (process.env.NODE_ENV === 'development') {
      logger.debug('Utilizador encontrado', { userId: user._id, email: user.email });
    }

    // Adicionar utilizador ao request
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Token inválido', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Token expirado', 401));
    } else {
      next(error);
    }
  }
};

/**
 * Middleware de autorização - verifica se utilizador tem role específica
 */
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('Não autenticado', 401));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new AppError('Acesso negado - permissões insuficientes', 403));
      return;
    }

    next();
  };
};

/**
 * Middleware opcional de autenticação - não falha se não houver token
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwt.secret) as { userId: string };
    const user = await User.findById(decoded.userId);

    if (user && !user.isDeleted) {
      req.user = user;
    }

    next();
  } catch (error) {
    // Ignorar erros de token em autenticação opcional
    next();
  }
};


