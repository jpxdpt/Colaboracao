import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import expressRateLimit from 'express-rate-limit';
import { config } from '../config';
import { logger } from '../utils/logger';

export const setupMiddleware = (app: Express): void => {
  // Logging básico para debug (apenas em desenvolvimento)
  if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
      logger.debug(`Request recebida`, {
        method: req.method,
        path: req.path,
        hasAuth: !!req.headers.authorization,
        origin: req.headers.origin,
        ip: req.ip
      });
      next();
    });
  }

  // Security
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS - Permitir múltiplas origens em desenvolvimento
  const allowedOrigins = [
    config.frontendUrl,
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
  ];

  // Permitir origens adicionais via variável de ambiente (separadas por vírgula)
  const additionalOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
    : [];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Permitir requisições sem origin (mobile apps, Postman, etc)
        if (!origin) {
          callback(null, true);
          return;
        }

        // Verificar se está na lista de origens permitidas
        if (allowedOrigins.includes(origin) || additionalOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        // Em desenvolvimento, permitir origens do Dev Tunnels e similares
        if (config.nodeEnv === 'development') {
          // Permitir padrões de Dev Tunnels (*.devtunnels.ms)
          if (origin.includes('.devtunnels.ms') || origin.includes('devtunnels')) {
            callback(null, true);
            return;
          }
          // Permitir padrões de ngrok (*.ngrok.io, *.ngrok-free.app)
          if (origin.includes('.ngrok.io') || origin.includes('.ngrok-free.app')) {
            callback(null, true);
            return;
          }
          // Permitir padrões de localtunnel (*.loca.lt)
          if (origin.includes('.loca.lt')) {
            callback(null, true);
            return;
          }
        }

        // Se não passou em nenhuma verificação, bloquear
        logger.warn(`CORS bloqueado para origem não autorizada`, {
          origin,
        });
        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Body parser
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Rate limiting
  const limiter = expressRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    store: undefined, // Will use Redis store when available
  });

  app.use('/api/', limiter);
};

