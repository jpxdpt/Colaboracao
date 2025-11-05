import express from 'express';
import { body, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import TaskTemplate from '../models/TaskTemplate.js';
import { AuthRequest, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/templates - Listar templates
router.get('/', async (req: AuthRequest, res) => {
  try {
    const templates = await TaskTemplate.find()
      .populate('created_by', 'name')
      .sort({ name: 1 })
      .lean();

    const formattedTemplates = templates.map((template: any) => ({
      id: template._id.toString(),
      name: template.name,
      description: template.description,
      title: template.title,
      default_description: template.default_description,
      default_priority: template.default_priority,
      default_tags: template.default_tags || [],
      created_by: template.created_by._id.toString(),
      created_at: template.created_at,
    }));

    res.json({ templates: formattedTemplates });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Erro ao buscar templates' });
  }
});

// POST /api/templates - Criar template
router.post(
  '/',
  requireAdmin,
  [
    body('name').trim().notEmpty().withMessage('Nome do template é obrigatório'),
    body('title').trim().notEmpty().withMessage('Título da tarefa é obrigatório'),
    body('default_priority').optional().isIn(['low', 'medium', 'high']),
    body('default_tags').optional().isArray(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, title, default_description, default_priority, default_tags } =
        req.body;
      const created_by = req.user!.userId;

      const template = await TaskTemplate.create({
        name,
        description,
        title,
        default_description,
        default_priority: default_priority || 'medium',
        default_tags: default_tags || [],
        created_by: new Types.ObjectId(created_by),
      });

      res.status(201).json({ template });
    } catch (error) {
      console.error('Create template error:', error);
      res.status(500).json({ error: 'Erro ao criar template' });
    }
  }
);

// DELETE /api/templates/:id - Eliminar template
router.delete('/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const templateId = req.params.id;

    if (!Types.ObjectId.isValid(templateId)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const template = await TaskTemplate.findByIdAndDelete(templateId);

    if (!template) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }

    res.json({ message: 'Template eliminado com sucesso' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ error: 'Erro ao eliminar template' });
  }
});

export default router;

