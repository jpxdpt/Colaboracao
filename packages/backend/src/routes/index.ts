import { Express } from 'express';
import healthRoutes from './health';
import authRoutes from './auth';
import taskRoutes from './tasks';
import goalRoutes from './goals';
import reportRoutes from './reports';
import gamificationRoutes from './gamification';
import trainingRoutes from './training';
import kpiRoutes from './kpis';
import auditRoutes from './audit';
import activityRoutes from './activities';
import recognitionRoutes from './recognition';

export const setupRoutes = (app: Express): void => {
  // Health check
  app.use('/health', healthRoutes);

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/goals', goalRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/gamification', gamificationRoutes);
  app.use('/api/training', trainingRoutes);
  app.use('/api/kpis', kpiRoutes);
  app.use('/api/audit', auditRoutes);
  app.use('/api/activities', activityRoutes);
  app.use('/api/recognition', recognitionRoutes);
  // app.use('/api/users', userRoutes);
  // etc.
};

