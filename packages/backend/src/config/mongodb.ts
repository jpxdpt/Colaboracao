import mongoose from 'mongoose';
import { config } from './index';
import { logger } from '../utils/logger';

let isConnected = false;

export const connectMongoDB = async (): Promise<void> => {
  if (isConnected) {
    logger.info('MongoDB already connected');
    return;
  }

  if (!config.mongodb.uri) {
    throw new Error('MONGODB_URI is not defined');
  }

  try {
    const options: mongoose.ConnectOptions = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(config.mongodb.uri, options);

    isConnected = true;
    logger.info('MongoDB connected successfully');

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      isConnected = false;
    });
  } catch (error) {
    logger.error('MongoDB connection failed:', error);
    isConnected = false;
    throw error;
  }
};

export const disconnectMongoDB = async (): Promise<void> => {
  if (!isConnected) {
    return;
  }

  await mongoose.disconnect();
  isConnected = false;
  logger.info('MongoDB disconnected');
};


