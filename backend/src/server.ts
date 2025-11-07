import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import taskRoutes from './routes/task.routes.js';
import userRoutes from './routes/user.routes.js';
import commentRoutes from './routes/comment.routes.js';
import tagRoutes from './routes/tag.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import templateRoutes from './routes/template.routes.js';
import attachmentRoutes from './routes/attachment.routes.js';
import reportRoutes from './routes/report.routes.js';
import timeEntryRoutes from './routes/timeEntry.routes.js';
import apiDocsRoutes from './routes/api-docs.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authenticateToken } from './middleware/auth.js';
import { connectDB } from './db/connection.js';
import path from 'path';

dotenv.config();

const app = express();

// Socket.io e HTTP Server - apenas em ambiente não-serverless
let httpServer: ReturnType<typeof createServer> | null = null;
let io: Server | null = null;

if (process.env.VERCEL !== '1') {
  httpServer = createServer(app);
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
  });
}

const PORT = process.env.PORT || 8081;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir ficheiros estáticos (uploads)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Conectar ao MongoDB
connectDB().catch((err) => {
  console.error('Erro ao conectar ao MongoDB:', err);
  // No Vercel, não fazer exit para não quebrar o deploy
  if (process.env.VERCEL !== '1') {
    process.exit(1);
  }
});

// Health check
app.get('/health', async (req, res) => {
  try {
    const mongoose = await import('./db/connection.js');
    const isConnected = mongoose.default.connection.readyState === 1;
    res.json({ status: 'ok', database: isConnected ? 'connected' : 'disconnected' });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

// Routes
app.use('/api/docs', apiDocsRoutes); // Documentação da API (sem autenticação)
app.use('/api/auth', authRoutes);
app.use('/api/tasks', authenticateToken, taskRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/comments', authenticateToken, commentRoutes);
app.use('/api/tags', authenticateToken, tagRoutes);
app.use('/api/notifications', authenticateToken, notificationRoutes);
app.use('/api/templates', authenticateToken, templateRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/time-entries', authenticateToken, timeEntryRoutes);

// Error handler
app.use(errorHandler);

// Socket.io connection handling - apenas se disponível
if (io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (token) {
      // Token validation will be done in the connection handler
      next();
    } else {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-room', (room) => {
      socket.join(room);
      console.log(`User ${socket.id} joined room: ${room}`);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
}

// Export io for use in routes
export { io };

// Iniciar servidor apenas em desenvolvimento/local
// No Vercel, a app é exportada como serverless function
if (process.env.VERCEL !== '1' && httpServer) {
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    if (io) {
      console.log(`📡 Socket.io ready for connections`);
    }
  });
} else if (process.env.VERCEL === '1') {
  // No Vercel, Socket.io não funciona bem
  console.log('Running on Vercel - Socket.io disabled');
}

// Exportar app para Vercel serverless
// Quando compilado para CommonJS, export default vira exports.default
export default app;

