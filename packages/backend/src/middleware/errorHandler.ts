import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const setupErrorHandling = (app: any): void => {
  // 404 handler
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log('❌ 404 - Rota não encontrada:', {
      method: req.method,
      path: req.path,
      originalUrl: req.originalUrl,
      headers: {
        authorization: req.headers.authorization ? 'present' : 'missing'
      }
    });
    const error = new AppError(`Route ${req.originalUrl} not found`, 404);
    next(error);
  });

  // Global error handler
  app.use((err: AppError, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    logger.error({
      error: message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });

    res.status(statusCode).json({
      success: false,
      error: {
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
      },
    });
  });
};

