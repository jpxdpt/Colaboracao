import { Response } from 'express';
import { PeerRecognition } from '../models';
import { z } from 'zod';
import { awardPoints } from '../services/gamificationService';
import { AuthRequest } from '../middleware/auth';

const createRecognitionSchema = z.object({
  to: z.string().min(1),
  type: z.enum(['kudos', 'thanks', 'appreciation']),
  message: z.string().min(1).max(500),
  points: z.number().int().min(0).optional(),
  public: z.boolean().default(true),
});

/**
 * GET /api/recognition - Feed de reconhecimentos
 */
export const getRecognitionFeed = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { limit = 50 } = req.query;

    const recognitions = await PeerRecognition.find({ public: true })
      .populate('from', 'name email avatar')
      .populate('to', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string))
      .lean();

    res.json(recognitions);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar reconhecimentos' });
  }
};

/**
 * POST /api/recognition - Enviar reconhecimento
 */
export const sendRecognition = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const data = createRecognitionSchema.parse(req.body);

    if (data.to === userId) {
      res.status(400).json({ error: 'Não pode reconhecer a si mesmo' });
      return;
    }

    const recognition = new PeerRecognition({
      ...data,
      from: userId,
    });

    await recognition.save();

    // Atribuir pontos se especificado
    if (data.points && data.points > 0) {
      await awardPoints({
        userId: data.to,
        amount: data.points,
        source: 'peer_recognition',
        description: `Reconhecimento de ${data.type}: ${data.message}`,
        metadata: {
          recognitionId: recognition._id.toString(),
          from: userId,
          type: data.type,
        },
      });
    }

    await recognition.populate('from', 'name email avatar');
    await recognition.populate('to', 'name email avatar');

    res.status(201).json(recognition);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      return;
    }
    res.status(500).json({ error: 'Erro ao enviar reconhecimento' });
  }
};

