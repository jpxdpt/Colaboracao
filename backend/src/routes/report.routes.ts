import express from 'express';
import { query, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { AuthRequest, requireAdmin, authenticateToken } from '../middleware/auth.js';
import { generatePDFReport } from '../utils/pdfGenerator.js';
import { generateExcelReport } from '../utils/excelGenerator.js';

const router = express.Router();

// GET /api/reports/tasks - Exportar relatório de tarefas
router.get(
  '/tasks',
  authenticateToken,
  [
    query('format').isIn(['pdf', 'excel']).withMessage('Formato deve ser pdf ou excel'),
    query('status').optional().isIn(['pending', 'in_progress', 'completed']),
    query('priority').optional().isIn(['low', 'medium', 'high']),
    query('start_date').optional().isISO8601(),
    query('end_date').optional().isISO8601(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { format, status, priority, start_date, end_date } = req.query;
      const user = req.user!;

      // Construir query
      const queryFilter: any = {};

      if (user.role !== 'admin') {
        queryFilter.assigned_to = { $in: [new Types.ObjectId(user.userId)] };
      }

      if (status) {
        queryFilter.status = status;
      }

      if (priority) {
        queryFilter.priority = priority;
      }

      if (start_date || end_date) {
        queryFilter.created_at = {};
        if (start_date) {
          queryFilter.created_at.$gte = new Date(start_date as string);
        }
        if (end_date) {
          queryFilter.created_at.$lte = new Date(end_date as string);
        }
      }

      const tasks = await Task.find(queryFilter)
        .populate('assigned_to', 'name email')
        .populate('created_by', 'name email')
        .sort({ created_at: -1 })
        .lean();

      const formattedTasks = tasks.map((task: any) => ({
        id: task._id.toString(),
        title: task.title,
        description: task.description || '',
        assigned_to: Array.isArray(task.assigned_to)
          ? task.assigned_to.map((u: any) => u.name).join(', ')
          : 'Não atribuído',
        created_by: task.created_by?.name || 'Desconhecido',
        status: task.status,
        priority: task.priority,
        deadline: task.deadline ? new Date(task.deadline).toLocaleDateString('pt-PT') : 'Sem prazo',
        created_at: new Date(task.created_at).toLocaleDateString('pt-PT'),
      }));

      if (format === 'pdf') {
        const pdfBuffer = await generatePDFReport(formattedTasks, user);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=relatorio-tarefas-${Date.now()}.pdf`);
        res.send(pdfBuffer);
      } else if (format === 'excel') {
        const excelBuffer = await generateExcelReport(formattedTasks, user);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=relatorio-tarefas-${Date.now()}.xlsx`);
        res.send(excelBuffer);
      }
    } catch (error) {
      console.error('Export report error:', error);
      res.status(500).json({ error: 'Erro ao gerar relatório' });
    }
  }
);

// GET /api/reports/users - Exportar relatório de utilizadores (apenas admin)
router.get(
  '/users',
  requireAdmin,
  [
    query('format').isIn(['pdf', 'excel']).withMessage('Formato deve ser pdf ou excel'),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { format } = req.query;

      const users = await User.find().select('-password_hash').sort({ created_at: -1 }).lean();

      // Estatísticas de tarefas por utilizador
      const tasksByUser = await Task.aggregate([
        {
          $unwind: '$assigned_to',
        },
        {
          $group: {
            _id: '$assigned_to',
            total_tasks: { $sum: 1 },
            completed_tasks: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
            },
          },
        },
      ]);

      const tasksMap = new Map(tasksByUser.map((t: any) => [t._id.toString(), t]));

      const formattedUsers = users.map((user: any) => {
        const userTasks = tasksMap.get(user._id.toString());
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          total_tasks: userTasks?.total_tasks || 0,
          completed_tasks: userTasks?.completed_tasks || 0,
          created_at: new Date(user.created_at).toLocaleDateString('pt-PT'),
        };
      });

      if (format === 'pdf') {
        const pdfBuffer = await generatePDFReport(formattedUsers, req.user!, 'users');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=relatorio-utilizadores-${Date.now()}.pdf`);
        res.send(pdfBuffer);
      } else if (format === 'excel') {
        const excelBuffer = await generateExcelReport(formattedUsers, req.user!, 'users');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=relatorio-utilizadores-${Date.now()}.xlsx`);
        res.send(excelBuffer);
      }
    } catch (error) {
      console.error('Export users report error:', error);
      res.status(500).json({ error: 'Erro ao gerar relatório' });
    }
  }
);

export default router;

