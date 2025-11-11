import Redis from 'ioredis';
import { config } from './index';
import { logger } from '../utils/logger';

let redisClient: Redis | null = null;

export const connectRedis = async (): Promise<Redis | null> => {
  if (redisClient && redisClient.status === 'ready') {
    return redisClient;
  }

  try {
    // Se houver URL de conexão, usar ela (prioridade)
    // Caso contrário, usar host/port/password
    const redisOptions = config.redis.url
      ? config.redis.url
      : {
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
        };

    redisClient = new Redis(redisOptions, {
      retryStrategy: (times) => {
        // Stop retrying after 5 attempts
        if (times > 5) {
          logger.warn('Redis connection failed after 5 attempts. Continuing without Redis.');
          return null;
        }
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected');
    });

    redisClient.on('error', (err) => {
      logger.warn('Redis connection error:', err.message);
    });

    redisClient.on('close', () => {
      logger.warn('Redis connection closed');
    });

    // Try to connect, but don't fail if it doesn't work
    try {
      await redisClient.connect();
      await redisClient.ping();
      return redisClient;
    } catch (error) {
      logger.warn('Redis connection failed, continuing without Redis:', (error as Error).message);
      redisClient = null;
      return null;
    }
  } catch (error) {
    logger.warn('Redis initialization failed, continuing without Redis:', (error as Error).message);
    return null;
  }
};

export const getRedisClient = (): Redis | null => {
  return redisClient;
};

export const isRedisAvailable = (): boolean => {
  return redisClient !== null && redisClient.status === 'ready';
};

export const disconnectRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis disconnected');
  }
};

