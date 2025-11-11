import express from 'express';
import { setupMiddleware } from './middleware';
import { setupRoutes } from './routes';
import { setupErrorHandling } from './middleware/errorHandler';

export const createApp = () => {
  const app = express();

  // Setup middleware
  setupMiddleware(app);

  // Setup routes
  setupRoutes(app);

  // Setup error handling (must be last)
  setupErrorHandling(app);

  return app;
};



