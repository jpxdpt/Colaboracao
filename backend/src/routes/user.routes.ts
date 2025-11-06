import express, { Response } from 'express';
import { query, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import User from '../models/User.js';
import Task from '../models/Task.js';
import { AuthRequest, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/users - Listar todos os utilizadores (apenas admin)
router.get('/', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.find().select('-password_hash').sort({ created_at: -1 }).lean();

    const formattedUsers = users.map((user: any) => ({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      created_at: user.created_at,
    }));

    res.json({ users: formattedUsers });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Erro ao buscar utilizadores' });
  }
});

// GET /api/users/stats - Estatísticas de utilizadores (apenas admin)
router.get('/stats', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    // Estatísticas gerais
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalRegularUsers = await User.countDocuments({ role: 'user' });

    // Estatísticas de tarefas por utilizador
    const tasksByUser = await Task.aggregate([
      {
        $match: { assigned_to: { $ne: null } },
      },
      {
        $group: {
          _id: '$assigned_to',
          total_tasks: { $sum: 1 },
          completed_tasks: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          pending_tasks: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
          },
          in_progress_tasks: {
            $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
      {
        $match: { 'user.role': 'user' },
      },
      {
        $project: {
          id: '$_id',
          name: '$user.name',
          email: '$user.email',
          total_tasks: 1,
          completed_tasks: 1,
          pending_tasks: 1,
          in_progress_tasks: 1,
        },
      },
      {
        $sort: { total_tasks: -1 },
      },
    ]);

    res.json({
      total_users: totalUsers,
      total_admins: totalAdmins,
      total_regular_users: totalRegularUsers,
      tasks_by_user: tasksByUser.map((item) => ({
        id: item.id.toString(),
        name: item.name,
        email: item.email,
        total_tasks: item.total_tasks.toString(),
        completed_tasks: item.completed_tasks.toString(),
        pending_tasks: item.pending_tasks.toString(),
        in_progress_tasks: item.in_progress_tasks.toString(),
      })),
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// GET /api/users/:id - Obter utilizador específico
router.get('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.id;

    if (!Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const user = await User.findById(userId).select('-password_hash').lean();

    if (!user) {
      return res.status(404).json({ error: 'Utilizador não encontrado' });
    }

    res.json({
      user: {
        id: String(user._id),
        email: user.email,
        name: user.name,
        role: user.role,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Erro ao buscar utilizador' });
  }
});

// PUT /api/users/:id/role - Alterar role do utilizador
router.put('/:id/role', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;

    if (!Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    if (!role || !['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Role inválida' });
    }

    // Não permitir que o admin atual remova seu próprio role
    if (req.user!.userId === userId && role === 'user') {
      return res.status(400).json({
        error: 'Não pode remover seu próprio acesso de administrador',
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select('-password_hash');

    if (!user) {
      return res.status(404).json({ error: 'Utilizador não encontrado' });
    }

    res.json({
      user: {
        id: String(user._id),
        email: user.email,
        name: user.name,
        role: user.role,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Erro ao atualizar role do utilizador' });
  }
});

// DELETE /api/users/:id - Eliminar utilizador
router.delete('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.id;

    if (!Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    // Não permitir que o admin atual se elimine
    if (req.user!.userId === userId) {
      return res.status(400).json({
        error: 'Não pode eliminar sua própria conta',
      });
    }

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ error: 'Utilizador não encontrado' });
    }

    res.json({ message: 'Utilizador eliminado com sucesso' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Erro ao eliminar utilizador' });
  }
});

export default router;
