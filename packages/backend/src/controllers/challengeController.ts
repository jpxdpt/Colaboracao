import { Response } from 'express';
import { Challenge, ChallengeProgress, ChallengeTeamProgress, Team, TeamMember } from '../models';
import { z } from 'zod';
import { awardPoints } from '../services/gamificationService';
import { joinTeamToChallenge, updateTeamChallengeRanking, distributeChallengeRewards } from '../services/challengeService';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { UserRole, mongoIdSchema } from '@taskify/shared';

/**
 * GET /api/gamification/challenges - Lista desafios
 */
export const getChallenges = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, status } = req.query;

    const query: Record<string, unknown> = {};
    if (type) query.type = type;
    if (status) query.status = status;

    const challenges = await Challenge.find(query)
      .populate('rewards.badges')
      .populate('participants', 'name email avatar')
      .populate('participatingTeams', 'name avatar description')
      .sort({ startDate: -1 })
      .lean();

    res.json(challenges);
  } catch (error) {
    throw new AppError('Erro ao buscar desafios', 500);
  }
};

/**
 * GET /api/gamification/challenges/:id - Busca desafio por ID
 */
export const getChallengeById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = z.object({ id: mongoIdSchema }).parse(req.params);
    const challenge = await Challenge.findById(id)
      .populate('rewards.badges')
      .populate('participants', 'name email avatar')
      .populate('participatingTeams', 'name avatar description')
      .lean();

    if (!challenge) {
      throw new AppError('Desafio não encontrado', 404);
    }

    res.json(challenge);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Erro ao buscar desafio', 500);
  }
};

/**
 * POST /api/gamification/challenges/:id/join - Participar em desafio
 */
export const joinChallenge = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id?.toString();
    const { id: challengeId } = z.object({ id: mongoIdSchema }).parse(req.params);

    if (!userId) {
      throw new AppError('Não autenticado', 401);
    }

    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      throw new AppError('Desafio não encontrado', 404);
    }

    // Verificar se já participa
    if (challenge.participants.includes(userId as unknown as typeof challenge.participants[0])) {
      throw new AppError('Já está participando neste desafio', 400);
    }

    // Adicionar participante
    challenge.participants.push(userId as unknown as typeof challenge.participants[0]);
    await challenge.save();

    // Criar progresso inicial
    const progress = new ChallengeProgress({
      challenge: challengeId,
      user: userId,
      progress: challenge.objectives.map((_, index) => ({
        objectiveIndex: index,
        current: 0,
        completed: false,
      })),
      completed: false,
    });

    await progress.save();

    res.status(201).json({ success: true, challenge, progress });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao participar no desafio' });
  }
};

/**
 * GET /api/gamification/challenges/:id/progress - Progresso do utilizador
 */
export const getChallengeProgress = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id?.toString();
    const { id: challengeId } = z.object({ id: mongoIdSchema }).parse(req.params);

    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const progress = await ChallengeProgress.findOne({
      challenge: challengeId,
      user: userId,
    })
      .populate('challenge')
      .lean();

    if (!progress) {
      res.status(404).json({ error: 'Progresso não encontrado' });
      return;
    }

    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar progresso' });
  }
};

/**
 * POST /api/gamification/challenges/:id/teams/join - Juntar equipa a um desafio
 */
export const joinTeamToChallengeHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id?.toString();
    const { id: challengeId } = z.object({ id: mongoIdSchema }).parse(req.params);
    const { teamId } = z.object({ teamId: mongoIdSchema }).parse(req.body);

    if (!userId) {
      throw new AppError('Não autenticado', 401);
    }

    if (!teamId) {
      throw new AppError('ID da equipa é obrigatório', 400);
    }

    // Verificar se utilizador é membro da equipa
    const membership = await TeamMember.findOne({
      team: teamId,
      user: userId,
      active: true,
    });

    if (!membership) {
      throw new AppError('Não é membro desta equipa', 403);
    }

    await joinTeamToChallenge(challengeId, teamId);

    res.json({ success: true, message: 'Equipa juntou-se ao desafio com sucesso' });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Erro ao juntar equipa ao desafio' });
  }
};

/**
 * GET /api/gamification/challenges/:id/teams/ranking - Ranking de equipas no desafio
 */
export const getTeamChallengeRanking = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id: challengeId } = z.object({ id: mongoIdSchema }).parse(req.params);

    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      res.status(404).json({ error: 'Desafio não encontrado' });
      return;
    }

    if (!challenge.teamBased) {
      res.status(400).json({ error: 'Este desafio não é baseado em equipas' });
      return;
    }

    // Atualizar ranking antes de retornar
    await updateTeamChallengeRanking(challengeId);

    const teamProgresses = await ChallengeTeamProgress.find({ challenge: challengeId })
      .populate('team', 'name avatar description')
      .sort({ rank: 1 })
      .lean();

    res.json({
      success: true,
      data: teamProgresses,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar ranking de equipas' });
  }
};

/**
 * GET /api/gamification/challenges/:id/teams/:teamId/progress - Progresso de uma equipa
 */
export const getTeamChallengeProgress = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id: challengeId, teamId } = z.object({
      id: mongoIdSchema,
      teamId: mongoIdSchema
    }).parse(req.params);

    const teamProgress = await ChallengeTeamProgress.findOne({
      challenge: challengeId,
      team: teamId,
    })
      .populate('team', 'name avatar description')
      .populate('challenge')
      .lean();

    if (!teamProgress) {
      res.status(404).json({ error: 'Progresso da equipa não encontrado' });
      return;
    }

    res.json(teamProgress);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar progresso da equipa' });
  }
};

/**
 * POST /api/gamification/challenges - Criar novo desafio (apenas admin)
 */
export const createChallenge = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== UserRole.ADMIN) {
      throw new AppError('Apenas administradores podem criar desafios', 403);
    }

    const {
      title,
      description,
      type,
      startDate,
      endDate,
      objectives,
      rewards,
      teamBased = false,
    } = req.body;

    if (!title || !description || !type || !startDate || !endDate || !objectives) {
      throw new AppError('Dados incompletos', 400);
    }

    const challenge = new Challenge({
      title,
      description,
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      objectives,
      rewards: rewards || {},
      teamBased,
      status: new Date(startDate) > new Date() ? 'upcoming' : 'active',
      rewardsDistributed: false,
    });

    await challenge.save();

    res.status(201).json({
      success: true,
      data: challenge,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Erro ao criar desafio' });
  }
};

/**
 * POST /api/gamification/challenges/:id/distribute-rewards - Distribuir recompensas (apenas admin)
 */
export const distributeRewardsHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== UserRole.ADMIN) {
      throw new AppError('Apenas administradores podem distribuir recompensas', 403);
    }

    const { id: challengeId } = z.object({ id: mongoIdSchema }).parse(req.params);
    await distributeChallengeRewards(challengeId);

    res.json({
      success: true,
      message: 'Recompensas distribuídas com sucesso',
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Erro ao distribuir recompensas' });
  }
};

