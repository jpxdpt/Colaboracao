import express, { Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Types } from 'mongoose';
import Attachment from '../models/Attachment.js';
import Task from '../models/Task.js';
import { AuthRequest, authenticateToken } from '../middleware/auth.js';
import { logActivity } from '../utils/activityLogger.js';

const router = express.Router();

// Criar diretório de uploads se não existir (apenas se não estiver no Vercel)
const uploadsDir = path.join(process.cwd(), 'uploads');
if (process.env.VERCEL !== '1' && !fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
  } catch (error) {
    console.error('Erro ao criar diretório uploads:', error);
  }
}

// Configurar multer
// No Vercel, usar memória storage (sistema de ficheiros é read-only)
// Em outros ambientes, usar disk storage
const storage = process.env.VERCEL === '1' 
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, uploadsDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `file-${uniqueSuffix}${ext}`);
      },
    });

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Permitir todos os tipos de ficheiro
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// GET /api/attachments/task/:taskId - Listar anexos de uma tarefa
router.get('/task/:taskId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const taskId = req.params.taskId;

    if (!Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ error: 'ID de tarefa inválido' });
    }

    // Verificar se a tarefa existe e se o utilizador tem acesso
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    const user = req.user!;
    const isAssigned = task.assigned_to?.some(
      (id) => id.toString() === user.userId
    );
    const isCreator = task.created_by.toString() === user.userId;

    if (!isAssigned && !isCreator && user.role !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão para ver anexos desta tarefa' });
    }

    const attachments = await Attachment.find({ task_id: taskId })
      .populate('user_id', 'name email')
      .sort({ created_at: -1 })
      .lean();

    const formattedAttachments = attachments.map((att: any) => ({
      id: att._id.toString(),
      task_id: att.task_id.toString(),
      user_id: att.user_id._id.toString(),
      user_name: att.user_id.name,
      filename: att.filename,
      original_filename: att.original_filename,
      file_size: att.file_size,
      mime_type: att.mime_type,
      created_at: att.created_at,
      download_url: `/api/attachments/${att._id}/download`,
    }));

    res.json({ attachments: formattedAttachments });
  } catch (error) {
    console.error('Get attachments error:', error);
    res.status(500).json({ error: 'Erro ao buscar anexos' });
  }
});

// POST /api/attachments/task/:taskId - Upload de anexo
router.post(
  '/task/:taskId',
  authenticateToken,
  upload.single('file'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Nenhum ficheiro enviado' });
      }

      const taskId = req.params.taskId;
      const user = req.user!;

      if (!Types.ObjectId.isValid(taskId)) {
        // Limpar ficheiro se ID inválido (apenas se usar disk storage)
        if (req.file.path && process.env.VERCEL !== '1') {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({ error: 'ID de tarefa inválido' });
      }

      // Verificar se a tarefa existe e se o utilizador tem acesso
      const task = await Task.findById(taskId);
      if (!task) {
        if (req.file.path && process.env.VERCEL !== '1') {
          fs.unlinkSync(req.file.path);
        }
        return res.status(404).json({ error: 'Tarefa não encontrada' });
      }

      const isAssigned = task.assigned_to?.some(
        (id) => id.toString() === user.userId
      );
      const isCreator = task.created_by.toString() === user.userId;

      if (!isAssigned && !isCreator && user.role !== 'admin') {
        if (req.file.path && process.env.VERCEL !== '1') {
          fs.unlinkSync(req.file.path);
        }
        return res.status(403).json({ error: 'Sem permissão para adicionar anexos a esta tarefa' });
      }

      // No Vercel, uploads não são suportados (sistema de ficheiros read-only)
      if (process.env.VERCEL === '1') {
        return res.status(501).json({ 
          error: 'Uploads não são suportados no Vercel. Use um serviço externo como S3 ou Cloudinary.' 
        });
      }

      // Criar registo do anexo
      const attachment = await Attachment.create({
        task_id: taskId,
        user_id: user.userId,
        filename: req.file.filename,
        original_filename: req.file.originalname,
        file_path: req.file.path,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
      });

      // Log de atividade
      await logActivity({
        taskId,
        userId: user.userId,
        action: 'updated',
        field: 'attachment',
        newValue: req.file.originalname,
      });

      const populatedAttachment = await Attachment.findById(attachment._id)
        .populate('user_id', 'name email')
        .lean();

      res.status(201).json({
        attachment: {
          id: populatedAttachment!._id.toString(),
          task_id: populatedAttachment!.task_id.toString(),
          user_id: populatedAttachment!.user_id._id.toString(),
          user_name: (populatedAttachment!.user_id as any).name,
          filename: populatedAttachment!.filename,
          original_filename: populatedAttachment!.original_filename,
          file_size: populatedAttachment!.file_size,
          mime_type: populatedAttachment!.mime_type,
          created_at: populatedAttachment!.created_at,
          download_url: `/api/attachments/${populatedAttachment!._id}/download`,
        },
      });
    } catch (error) {
      console.error('Upload attachment error:', error);
      // Limpar ficheiro em caso de erro (apenas se usar disk storage)
      if (req.file && req.file.path && process.env.VERCEL !== '1') {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error('Erro ao eliminar ficheiro:', unlinkError);
        }
      }
      res.status(500).json({ error: 'Erro ao fazer upload do anexo' });
    }
  }
);

// GET /api/attachments/:id/download - Download de anexo
router.get('/:id/download', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    // No Vercel, downloads não são suportados (sistema de ficheiros read-only)
    if (process.env.VERCEL === '1') {
      return res.status(501).json({ 
        error: 'Downloads não são suportados no Vercel. Use um serviço externo como S3 ou Cloudinary.' 
      });
    }

    const attachmentId = req.params.id;

    if (!Types.ObjectId.isValid(attachmentId)) {
      return res.status(400).json({ error: 'ID de anexo inválido' });
    }

    const attachment = await Attachment.findById(attachmentId).populate('task_id');
    if (!attachment) {
      return res.status(404).json({ error: 'Anexo não encontrado' });
    }

    const task = attachment.task_id as any;
    const user = req.user!;

    // Verificar permissões
    const isAssigned = task.assigned_to?.some(
      (id: any) => id.toString() === user.userId
    );
    const isCreator = task.created_by.toString() === user.userId;

    if (!isAssigned && !isCreator && user.role !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão para descarregar este anexo' });
    }

    // Verificar se o ficheiro existe
    if (!fs.existsSync(attachment.file_path)) {
      return res.status(404).json({ error: 'Ficheiro não encontrado no servidor' });
    }

    // Enviar ficheiro
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.original_filename}"`);
    res.setHeader('Content-Type', attachment.mime_type);
    res.sendFile(path.resolve(attachment.file_path));
  } catch (error) {
    console.error('Download attachment error:', error);
    res.status(500).json({ error: 'Erro ao descarregar anexo' });
  }
});

// DELETE /api/attachments/:id - Eliminar anexo
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const attachmentId = req.params.id;
    const user = req.user!;

    if (!Types.ObjectId.isValid(attachmentId)) {
      return res.status(400).json({ error: 'ID de anexo inválido' });
    }

    const attachment = await Attachment.findById(attachmentId).populate('task_id');
    if (!attachment) {
      return res.status(404).json({ error: 'Anexo não encontrado' });
    }

    const task = attachment.task_id as any;

    // Verificar permissões (apenas criador do anexo ou admin pode eliminar)
    const isAttachmentCreator = attachment.user_id.toString() === user.userId;
    const isTaskCreator = task.created_by.toString() === user.userId;

    if (!isAttachmentCreator && !isTaskCreator && user.role !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão para eliminar este anexo' });
    }

    // Eliminar ficheiro do sistema de ficheiros
    if (fs.existsSync(attachment.file_path)) {
      fs.unlinkSync(attachment.file_path);
    }

    // Eliminar registo da base de dados
    await Attachment.findByIdAndDelete(attachmentId);

    // Log de atividade
    await logActivity({
      taskId: String(task._id),
      userId: user.userId,
      action: 'updated',
      field: 'attachment',
      oldValue: attachment.original_filename,
    });

    res.json({ message: 'Anexo eliminado com sucesso' });
  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({ error: 'Erro ao eliminar anexo' });
  }
});

export default router;

