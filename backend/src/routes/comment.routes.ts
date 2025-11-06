import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import Comment from '../models/Comment.js';
import Task from '../models/Task.js';
import { AuthRequest } from '../middleware/auth.js';
import { io } from '../server.js';
import { logActivity } from '../utils/activityLogger.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// POST /api/comments - Criar comentário
router.post(
  '/',
  [
    body('task_id').isString().withMessage('task_id é obrigatório'),
    body('content').trim().notEmpty().withMessage('Conteúdo do comentário é obrigatório'),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { task_id, content } = req.body;
      const user_id = req.user!.userId;

      if (!Types.ObjectId.isValid(task_id)) {
        return res.status(400).json({ error: 'ID da tarefa inválido' });
      }

      // Verificar se a tarefa existe
      const task = await Task.findById(task_id);

      if (!task) {
        return res.status(404).json({ error: 'Tarefa não encontrada' });
      }

      const user = req.user!;

      // Verificar permissões
      const assignedToArray = Array.isArray(task.assigned_to) 
        ? task.assigned_to.map((id: any) => String(id))
        : task.assigned_to 
          ? [String(task.assigned_to)] 
          : [];
      
      if (
        user.role !== 'admin' &&
        !assignedToArray.includes(user_id) &&
        task.created_by.toString() !== user_id
      ) {
        return res.status(403).json({
          error: 'Não tem permissão para comentar nesta tarefa',
        });
      }

      const comment = await Comment.create({
        task_id: new Types.ObjectId(task_id),
        user_id: new Types.ObjectId(user_id),
        content,
      });

      // Log de atividade
      await logActivity({
        taskId: task_id,
        userId: user_id,
        action: 'comment_added',
        field: 'comment',
        newValue: content,
      });

      const populatedComment = await Comment.findById(comment._id)
        .populate('user_id', 'name email')
        .lean();

      // Notificar responsáveis pela tarefa
      if (assignedToArray.length > 0) {
        for (const assignedUserId of assignedToArray) {
          if (assignedUserId !== user_id) {
            await Notification.create({
              user_id: assignedUserId,
              task_id: new Types.ObjectId(task_id),
              type: 'comment_added',
              title: 'Novo Comentário',
              message: `Novo comentário na tarefa: ${task.title}`,
            });

            if (io) {
              io.to(`user-${assignedUserId}`).emit('task-comment', {
                task_id,
                comment: populatedComment,
              });
            }
          }
        }
      }

      // Notificar via Socket.io
      if (io) {
        io.to(`task-${task_id}`).emit('new-comment', populatedComment);
      }

      res.status(201).json({
        comment: {
          id: populatedComment!._id.toString(),
          task_id: populatedComment!.task_id.toString(),
          user_id: populatedComment!.user_id._id.toString(),
          content: populatedComment!.content,
          created_at: populatedComment!.created_at,
          user_name: (populatedComment!.user_id as any).name,
          user_email: (populatedComment!.user_id as any).email,
        },
      });
    } catch (error) {
      console.error('Create comment error:', error);
      res.status(500).json({ error: 'Erro ao criar comentário' });
    }
  }
);

// GET /api/comments/task/:task_id - Obter comentários de uma tarefa
router.get('/task/:task_id', async (req: AuthRequest, res: Response) => {
  try {
    const task_id = req.params.task_id;
    const user = req.user!;

    if (!Types.ObjectId.isValid(task_id)) {
      return res.status(400).json({ error: 'ID da tarefa inválido' });
    }

    // Verificar se a tarefa existe e permissões
    const task = await Task.findById(task_id);

    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    // Verificar permissões
    const assignedToArray = Array.isArray(task.assigned_to) 
      ? task.assigned_to.map((id: any) => String(id))
      : task.assigned_to 
        ? [String(task.assigned_to)] 
        : [];
    
    if (
      user.role !== 'admin' &&
      !assignedToArray.includes(user.userId) &&
      task.created_by.toString() !== user.userId
    ) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const comments = await Comment.find({ task_id })
      .populate('user_id', 'name email')
      .sort({ created_at: 1 })
      .lean();

    const formattedComments = comments.map((c: any) => ({
      id: c._id.toString(),
      task_id: c.task_id.toString(),
      user_id: c.user_id._id.toString(),
      content: c.content,
      created_at: c.created_at,
      user_name: (c.user_id as any).name,
      user_email: (c.user_id as any).email,
    }));

    res.json({ comments: formattedComments });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Erro ao buscar comentários' });
  }
});

// DELETE /api/comments/:id - Eliminar comentário
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const comment_id = req.params.id;
    const user = req.user!;

    if (!Types.ObjectId.isValid(comment_id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const comment = await Comment.findById(comment_id);

    if (!comment) {
      return res.status(404).json({ error: 'Comentário não encontrado' });
    }

    // Verificar permissões
    if (user.role !== 'admin' && comment.user_id.toString() !== user.userId) {
      return res.status(403).json({
        error: 'Não tem permissão para eliminar este comentário',
      });
    }

    await Comment.findByIdAndDelete(comment_id);

    // Notificar via Socket.io
    if (io) {
      io.to(`task-${comment.task_id.toString()}`).emit('comment-deleted', { comment_id });
    }

    res.json({ message: 'Comentário eliminado com sucesso' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Erro ao eliminar comentário' });
  }
});

export default router;
