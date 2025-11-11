import { Response } from 'express';
import { Team, TeamMember, TeamMessage } from '../models';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { UserRole } from '@gamify/shared';

const createTeamSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  avatar: z.string().optional(),
  logo: z.string().optional(),
});

const teamMessageSchema = z.object({
  content: z.string().min(1).max(2000),
});

/**
 * GET /api/gamification/teams - Lista equipas
 */
export const getTeams = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teams = await Team.find()
      .populate('createdBy', 'name email avatar')
      .populate('members', 'name email avatar')
      .sort({ totalPoints: -1 })
      .lean();

    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar equipas' });
  }
};

/**
 * POST /api/gamification/teams - Criar equipa
 */
export const createTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id?.toString();
    const userRole = req.user?.role;
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    if (userRole !== UserRole.ADMIN) {
      res.status(403).json({ error: 'Apenas administradores podem criar equipas' });
      return;
    }

    const data = createTeamSchema.parse(req.body);

    const team = new Team({
      ...data,
      createdBy: userId,
      members: [userId],
      totalPoints: 0,
      activeChallenges: [],
    });

    await team.save();

    // Criar membro líder
    const teamMember = new TeamMember({
      team: team._id,
      user: userId,
      role: 'leader',
      pointsContributed: 0,
      active: true,
    });

    await teamMember.save();

    await team.populate('createdBy', 'name email avatar');
    await team.populate('members', 'name email avatar');

    res.status(201).json(team);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      return;
    }
    res.status(500).json({ error: 'Erro ao criar equipa' });
  }
};

/**
 * POST /api/gamification/teams/:id/join - Juntar-se a equipa
 */
export const joinTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id?.toString();
    const teamId = req.params.id;

    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const team = await Team.findById(teamId);
    if (!team) {
      res.status(404).json({ error: 'Equipa não encontrada' });
      return;
    }

    // Verificar se já é membro
    const existingMember = await TeamMember.findOne({
      team: teamId,
      user: userId,
    });

    if (existingMember) {
      res.status(400).json({ error: 'Já é membro desta equipa' });
      return;
    }

    // Adicionar membro
    team.members.push(userId as unknown as typeof team.members[0]);
    await team.save();

    const teamMember = new TeamMember({
      team: teamId,
      user: userId,
      role: 'member',
      pointsContributed: 0,
      active: true,
    });

    await teamMember.save();

    res.status(201).json({ success: true, team, member: teamMember });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao juntar-se à equipa' });
  }
};

export const leaveTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id?.toString();
    const teamId = req.params.id;

    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const team = await Team.findById(teamId);
    if (!team) {
      res.status(404).json({ error: 'Equipa não encontrada' });
      return;
    }

    const teamMember = await TeamMember.findOne({
      team: teamId,
      user: userId,
      active: true,
    });

    if (!teamMember) {
      res.status(400).json({ error: 'Não é membro desta equipa' });
      return;
    }

    if (team.createdBy?.toString() === userId) {
      res.status(400).json({ error: 'O criador da equipa não pode sair da própria equipa' });
      return;
    }

    team.members = team.members.filter((memberId) => memberId.toString() !== userId);
    await team.save();

    teamMember.active = false;
    await teamMember.save();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao sair da equipa' });
  }
};

export const updateTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const teamId = req.params.id;
    const team = await Team.findById(teamId);

    if (!team) {
      res.status(404).json({ error: 'Equipa não encontrada' });
      return;
    }

    if (req.user?.role !== UserRole.ADMIN) {
      res.status(403).json({ error: 'Apenas administradores podem editar equipas' });
      return;
    }

    const schema = createTeamSchema.partial();
    const data = schema.parse(req.body);

    Object.assign(team, data);
    await team.save();

    await team.populate('createdBy', 'name email avatar');
    await team.populate('members', 'name email avatar');

    res.json(team);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      return;
    }
    res.status(500).json({ error: 'Erro ao atualizar equipa' });
  }
};

export const getTeamMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id?.toString();
    const teamId = req.params.id;

    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const team = await Team.findById(teamId).lean();
    if (!team) {
      res.status(404).json({ error: 'Equipa não encontrada' });
      return;
    }

    const isMember = await TeamMember.findOne({
      team: teamId,
      user: userId,
      active: true,
    });

    if (!isMember && team.createdBy?.toString() !== userId && req.user?.role !== UserRole.ADMIN) {
      res.status(403).json({ error: 'Apenas membros podem visualizar o chat da equipa' });
      return;
    }

    const messages = await TeamMessage.find({ team: teamId })
      .populate('user', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar mensagens da equipa' });
  }
};

export const createTeamMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id?.toString();
    const teamId = req.params.id;

    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const data = teamMessageSchema.parse(req.body);

    const team = await Team.findById(teamId);
    if (!team) {
      res.status(404).json({ error: 'Equipa não encontrada' });
      return;
    }

    const isMember = await TeamMember.findOne({
      team: teamId,
      user: userId,
      active: true,
    });

    if (!isMember && team.createdBy?.toString() !== userId && req.user?.role !== UserRole.ADMIN) {
      res.status(403).json({ error: 'Apenas membros podem enviar mensagens nesta equipa' });
      return;
    }

    const message = new TeamMessage({
      team: teamId,
      user: userId,
      content: data.content.trim(),
    });

    await message.save();
    await message.populate('user', 'name email avatar');

    res.status(201).json(message);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Mensagem inválida', details: error.errors });
      return;
    }
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
};

