import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { User, IUser } from '../models/User';
import { AppError } from './errorHandler';
import { isTokenBlacklisted } from '../services/authService';

export interface AuthRequest extends Request {
  user?: IUser;
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

    // Log para debug
    console.log('🔍 Auth Middleware:', {
      hasAuthHeader: !!authHeader,
      authHeaderStart: authHeader?.substring(0, 20),
      path: req.path,
      method: req.method
    });

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('❌ Token não fornecido ou formato inválido');
      throw new AppError('Token de autenticação não fornecido', 401);
    }

    const token = authHeader.substring(7);
    console.log('🔑 Token extraído:', {
      tokenLength: token.length,
      tokenStart: token.substring(0, 20) + '...'
    });

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
      console.log('✅ Token válido, userId:', decoded.userId);
    } catch (jwtError) {
      console.error('❌ Erro ao verificar token:', {
        error: jwtError instanceof Error ? jwtError.message : 'Unknown error',
        errorType: jwtError instanceof jwt.JsonWebTokenError ? 'JsonWebTokenError' : 
                   jwtError instanceof jwt.TokenExpiredError ? 'TokenExpiredError' : 'Other'
      });
      throw jwtError;
    }

    // Buscar utilizador (sem password para melhor performance)
    const user = await User.findById(decoded.userId);

    if (!user) {
      console.error('❌ Utilizador não encontrado:', decoded.userId);
      throw new AppError('Utilizador não encontrado', 401);
    }
    
    if (user.isDeleted) {
      console.warn('⚠️ Utilizador marcado como eliminado tentou autenticar:', user.email);
      throw new AppError('Conta desativada. Contacte o suporte.', 403);
    }
    
    console.log('✅ Utilizador encontrado:', user.email);

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


