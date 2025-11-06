import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import Tag from '../models/Tag.js';
import { AuthRequest, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/tags - Listar todas as tags
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const tags = await Tag.find().populate('created_by', 'name').sort({ name: 1 }).lean();

    const formattedTags = tags.map((tag: any) => ({
      id: tag._id.toString(),
      name: tag.name,
      color: tag.color,
      created_by: tag.created_by._id.toString(),
      created_at: tag.created_at,
    }));

    res.json({ tags: formattedTags });
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({ error: 'Erro ao buscar tags' });
  }
});

// POST /api/tags - Criar tag
router.post(
  '/',
  requireAdmin,
  [
    body('name').trim().notEmpty().withMessage('Nome da tag é obrigatório'),
    body('color').optional().isString(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, color } = req.body;
      const created_by = req.user!.userId;

      // Verificar se tag já existe
      const existingTag = await Tag.findOne({ name: name.toLowerCase() });
      if (existingTag) {
        return res.status(400).json({ error: 'Tag já existe' });
      }

      const tag = await Tag.create({
        name: name.toLowerCase(),
        color: color || '#3B82F6',
        created_by: new Types.ObjectId(created_by),
      });

      res.status(201).json({ tag });
    } catch (error: any) {
      console.error('Create tag error:', error);
      if (error.code === 11000) {
        return res.status(400).json({ error: 'Tag já existe' });
      }
      res.status(500).json({ error: 'Erro ao criar tag' });
    }
  }
);

// DELETE /api/tags/:id - Eliminar tag
router.delete('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const tagId = req.params.id;

    if (!Types.ObjectId.isValid(tagId)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const tag = await Tag.findByIdAndDelete(tagId);

    if (!tag) {
      return res.status(404).json({ error: 'Tag não encontrada' });
    }

    res.json({ message: 'Tag eliminada com sucesso' });
  } catch (error) {
    console.error('Delete tag error:', error);
    res.status(500).json({ error: 'Erro ao eliminar tag' });
  }
});

export default router;

