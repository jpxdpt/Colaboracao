import express, { Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import TimeEntry from '../models/TimeEntry.js';
import Task from '../models/Task.js';
import { AuthRequest, authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/time-entries - Listar entradas de tempo
router.get(
  '/',
  authenticateToken,
  [
    query('task_id').optional().isString(),
    query('user_id').optional().isString(),
    query('start_date').optional().isISO8601(),
    query('end_date').optional().isISO8601(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { task_id, user_id, start_date, end_date } = req.query;
      const currentUser = req.user!;

      const queryFilter: any = {};

      // User comum só vê suas próprias entradas
      if (currentUser.role !== 'admin') {
        queryFilter.user_id = new Types.ObjectId(currentUser.userId);
      } else if (user_id) {
        queryFilter.user_id = new Types.ObjectId(user_id as string);
      }

      if (task_id) {
        queryFilter.task_id = new Types.ObjectId(task_id as string);
      }

      if (start_date || end_date) {
        queryFilter.start_time = {};
        if (start_date) {
          queryFilter.start_time.$gte = new Date(start_date as string);
        }
        if (end_date) {
          queryFilter.start_time.$lte = new Date(end_date as string);
        }
      }

      const timeEntries = await TimeEntry.find(queryFilter)
        .populate('task_id', 'title')
        .populate('user_id', 'name email')
        .sort({ start_time: -1 })
        .lean();

      const formattedEntries = timeEntries.map((entry: any) => ({
        id: entry._id.toString(),
        task_id: entry.task_id._id.toString(),
        task_title: entry.task_id.title,
        user_id: entry.user_id._id.toString(),
        user_name: entry.user_id.name,
        start_time: entry.start_time,
        end_time: entry.end_time || null,
        duration: entry.duration || 0,
        description: entry.description || null,
        created_at: entry.created_at,
        updated_at: entry.updated_at,
      }));

      res.json({ timeEntries: formattedEntries });
    } catch (error) {
      console.error('Get time entries error:', error);
      res.status(500).json({ error: 'Erro ao buscar entradas de tempo' });
    }
  }
);

// POST /api/time-entries - Criar nova entrada de tempo
router.post(
  '/',
  authenticateToken,
  [
    body('task_id').notEmpty().withMessage('ID da tarefa é obrigatório'),
    body('start_time').optional().isISO8601(),
    body('end_time').optional().isISO8601(),
    body('description').optional().trim(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { task_id, start_time, end_time, description } = req.body;
      const user = req.user!;

      // Verificar se a tarefa existe e se o utilizador tem acesso
      const task = await Task.findById(task_id);
      if (!task) {
        return res.status(404).json({ error: 'Tarefa não encontrada' });
      }

      const isAssigned = task.assigned_to?.some(
        (id) => id.toString() === user.userId
      );
      const isCreator = task.created_by.toString() === user.userId;

      if (!isAssigned && !isCreator && user.role !== 'admin') {
        return res.status(403).json({ error: 'Sem permissão para adicionar tempo a esta tarefa' });
      }

      const timeEntry = await TimeEntry.create({
        task_id,
        user_id: user.userId,
        start_time: start_time ? new Date(start_time) : new Date(),
        end_time: end_time ? new Date(end_time) : null,
        description,
      });

      const populatedEntry = await TimeEntry.findById(timeEntry._id)
        .populate('task_id', 'title')
        .populate('user_id', 'name email')
        .lean();

      res.status(201).json({
        timeEntry: {
          id: populatedEntry!._id.toString(),
          task_id: populatedEntry!.task_id._id.toString(),
          task_title: (populatedEntry!.task_id as any).title,
          user_id: populatedEntry!.user_id._id.toString(),
          user_name: (populatedEntry!.user_id as any).name,
          start_time: populatedEntry!.start_time,
          end_time: populatedEntry!.end_time || null,
          duration: populatedEntry!.duration || 0,
          description: populatedEntry!.description || null,
          created_at: populatedEntry!.created_at,
          updated_at: populatedEntry!.updated_at,
        },
      });
    } catch (error) {
      console.error('Create time entry error:', error);
      res.status(500).json({ error: 'Erro ao criar entrada de tempo' });
    }
  }
);

// PUT /api/time-entries/:id - Atualizar entrada de tempo
router.put(
  '/:id',
  authenticateToken,
  [
    body('end_time').optional().isISO8601(),
    body('description').optional().trim(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const entryId = req.params.id;
      const { end_time, description } = req.body;
      const user = req.user!;

      if (!Types.ObjectId.isValid(entryId)) {
        return res.status(400).json({ error: 'ID inválido' });
      }

      const timeEntry = await TimeEntry.findById(entryId);
      if (!timeEntry) {
        return res.status(404).json({ error: 'Entrada de tempo não encontrada' });
      }

      // Verificar permissões
      if (timeEntry.user_id.toString() !== user.userId && user.role !== 'admin') {
        return res.status(403).json({ error: 'Sem permissão para atualizar esta entrada' });
      }

      const updateData: any = {};
      if (end_time !== undefined) {
        updateData.end_time = end_time ? new Date(end_time) : null;
      }
      if (description !== undefined) {
        updateData.description = description;
      }

      const updatedEntry = await TimeEntry.findByIdAndUpdate(entryId, updateData, {
        new: true,
        runValidators: true,
      })
        .populate('task_id', 'title')
        .populate('user_id', 'name email')
        .lean();

      res.json({
        timeEntry: {
          id: updatedEntry!._id.toString(),
          task_id: updatedEntry!.task_id._id.toString(),
          task_title: (updatedEntry!.task_id as any).title,
          user_id: updatedEntry!.user_id._id.toString(),
          user_name: (updatedEntry!.user_id as any).name,
          start_time: updatedEntry!.start_time,
          end_time: updatedEntry!.end_time || null,
          duration: updatedEntry!.duration || 0,
          description: updatedEntry!.description || null,
          created_at: updatedEntry!.created_at,
          updated_at: updatedEntry!.updated_at,
        },
      });
    } catch (error) {
      console.error('Update time entry error:', error);
      res.status(500).json({ error: 'Erro ao atualizar entrada de tempo' });
    }
  }
);

// DELETE /api/time-entries/:id - Eliminar entrada de tempo
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const entryId = req.params.id;
    const user = req.user!;

    if (!Types.ObjectId.isValid(entryId)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const timeEntry = await TimeEntry.findById(entryId);
    if (!timeEntry) {
      return res.status(404).json({ error: 'Entrada de tempo não encontrada' });
    }

    // Verificar permissões
    if (timeEntry.user_id.toString() !== user.userId && user.role !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão para eliminar esta entrada' });
    }

    await TimeEntry.findByIdAndDelete(entryId);

    res.json({ message: 'Entrada de tempo eliminada com sucesso' });
  } catch (error) {
    console.error('Delete time entry error:', error);
    res.status(500).json({ error: 'Erro ao eliminar entrada de tempo' });
  }
});

// GET /api/time-entries/task/:taskId/summary - Resumo de tempo por tarefa
router.get('/task/:taskId/summary', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const taskId = req.params.taskId;
    const user = req.user!;

    if (!Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ error: 'ID de tarefa inválido' });
    }

    // Verificar se a tarefa existe e se o utilizador tem acesso
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    const isAssigned = task.assigned_to?.some((id) => id.toString() === user.userId);
    const isCreator = task.created_by.toString() === user.userId;

    if (!isAssigned && !isCreator && user.role !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão para ver tempo desta tarefa' });
    }

    const queryFilter: any = { task_id: new Types.ObjectId(taskId) };
    if (user.role !== 'admin') {
      queryFilter.user_id = new Types.ObjectId(user.userId);
    }

    const timeEntries = await TimeEntry.find(queryFilter).lean();

    const totalMinutes = timeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    const summary = {
      total_entries: timeEntries.length,
      total_minutes: totalMinutes,
      total_hours: totalHours,
      remaining_minutes: remainingMinutes,
      formatted_time: `${totalHours}h ${remainingMinutes}m`,
    };

    res.json({ summary });
  } catch (error) {
    console.error('Get time summary error:', error);
    res.status(500).json({ error: 'Erro ao buscar resumo de tempo' });
  }
});

export default router;

