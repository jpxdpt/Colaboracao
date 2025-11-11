import { Response } from 'express';
import { Companion } from '../models';
import { AuthRequest } from '../middleware/auth';

/**
 * GET /api/gamification/companions - Companheiro do utilizador
 */
export const getCompanion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    let companion = await Companion.findOne({ user: userId });

    if (!companion) {
      companion = new Companion({
        user: userId,
        type: 'pet',
        name: 'Aventureiro',
        level: 1,
        experience: 0,
        currentEvolution: 0,
        nextEvolutionLevel: 5,
      });
      await companion.save();
    }

    res.json(companion.toObject());
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar companheiro' });
  }
};

/**
 * PUT /api/gamification/companions - Atualizar companheiro (nome, etc)
 */
export const updateCompanion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const { name } = req.body;

    let companion = await Companion.findOne({ user: userId });

    if (!companion) {
      companion = new Companion({
        user: userId,
        type: 'pet',
        name: name || 'Aventureiro',
        level: 1,
        experience: 0,
        currentEvolution: 0,
        nextEvolutionLevel: 5,
      });
    } else if (name) {
      companion.name = name;
    }

    await companion.save();

    res.json(companion.toObject());
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar companheiro' });
  }
};

/**
 * POST /api/gamification/companions/feed - Alimentar companheiro (ganha XP)
 */
export const feedCompanion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const { xp = 10 } = req.body;

    let companion = await Companion.findOne({ user: userId });

    if (!companion) {
      companion = new Companion({
        user: userId,
        type: 'pet',
        name: 'Aventureiro',
        level: 1,
        experience: 0,
        currentEvolution: 0,
        nextEvolutionLevel: 5,
      });
    }

    // Adicionar experiência
    companion.experience += xp;

    // Calcular nível baseado em XP (fórmula simples: nível = sqrt(XP / 10))
    const newLevel = Math.floor(Math.sqrt(companion.experience / 10)) + 1;
    const leveledUp = newLevel > companion.level;
    companion.level = newLevel;

    // Verificar evolução
    const newEvolution = Math.floor(companion.level / companion.nextEvolutionLevel);
    const evolved = newEvolution > companion.currentEvolution;
    companion.currentEvolution = newEvolution;

    await companion.save();

    res.json({
      companion: companion.toObject(),
      leveledUp,
      evolved,
      newLevel: companion.level,
      newEvolution: companion.currentEvolution,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao alimentar companheiro' });
  }
};

