import express, { Response } from 'express';
import { Types } from 'mongoose';
import Notification from '../models/Notification.js';
import { AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// GET /api/notifications - Listar notificações do utilizador
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { unread_only } = req.query;

    const query: any = { user_id: new Types.ObjectId(user.userId) };
    if (unread_only === 'true') {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .populate('task_id', 'title')
      .sort({ created_at: -1 })
      .limit(50)
      .lean();

    const formattedNotifications = notifications.map((notif: any) => ({
      id: notif._id.toString(),
      task_id: notif.task_id?._id?.toString() || null,
      task_title: notif.task_id?.title || null,
      type: notif.type,
      title: notif.title || notif.type,
      message: notif.message,
      read: notif.read,
      created_at: notif.created_at,
    }));

    res.json({ notifications: formattedNotifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Erro ao buscar notificações' });
  }
});

// GET /api/notifications/unread-count - Contar notificações não lidas
router.get('/unread-count', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const count = await Notification.countDocuments({
      user_id: new Types.ObjectId(user.userId),
      read: false,
    });

    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Erro ao contar notificações' });
  }
});

// PUT /api/notifications/:id/read - Marcar notificação como lida
router.put('/:id/read', async (req: AuthRequest, res: Response) => {
  try {
    const notificationId = req.params.id;
    const user = req.user!;

    if (!Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        user_id: new Types.ObjectId(user.userId),
      },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notificação não encontrada' });
    }

    res.json({ notification });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Erro ao marcar notificação como lida' });
  }
});

// PUT /api/notifications/read-all - Marcar todas como lidas
router.put('/read-all', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;

    await Notification.updateMany(
      {
        user_id: new Types.ObjectId(user.userId),
        read: false,
      },
      { read: true }
    );

    res.json({ message: 'Todas as notificações foram marcadas como lidas' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ error: 'Erro ao marcar notificações como lidas' });
  }
});

export default router;

