import express from 'express';
import { config } from './config';
import { connectMongoDB } from './config/mongodb';
import { connectRedis } from './config/redis';
import { setupMiddleware } from './middleware';
import { setupRoutes } from './routes';
import { setupErrorHandling } from './middleware/errorHandler';
import { logger } from './utils/logger';

const app = express();

// Setup middleware
setupMiddleware(app);

// Setup routes
setupRoutes(app);

// Setup error handling (must be last)
setupErrorHandling(app);

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectMongoDB();
    logger.info('MongoDB connected');

    // Connect to Redis (optional)
    const redis = await connectRedis();
    if (redis) {
      logger.info('Redis connected');
    } else {
      logger.warn('Redis not available, some features may be limited');
    }

    // Start Express server
    app.listen(config.port, '0.0.0.0', () => {
      logger.info(`🚀 Server running on http://localhost:${config.port}`);
      logger.info(`📡 API available at http://localhost:${config.port}/api`);
      logger.info(`🏥 Health check at http://localhost:${config.port}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;

