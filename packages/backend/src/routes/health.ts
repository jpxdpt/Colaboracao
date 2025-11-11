import { Router } from 'express';
import mongoose from 'mongoose';
import { getRedisClient, isRedisAvailable } from '../config/redis';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        redis: 'unknown',
      },
    };

    // Check Redis connection
    if (isRedisAvailable()) {
      try {
        const redis = getRedisClient();
        if (redis) {
          await redis.ping();
          health.services.redis = 'connected';
        } else {
          health.services.redis = 'unavailable';
        }
      } catch (error) {
        health.services.redis = 'disconnected';
      }
    } else {
      health.services.redis = 'unavailable';
    }

    // MongoDB is required, Redis is optional
    const isHealthy = health.services.mongodb === 'connected';

    res.status(isHealthy ? 200 : 503).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
});

export default router;

