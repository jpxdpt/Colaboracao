import { Response } from 'express';
import { Report, User } from '../models';
import { z } from 'zod';
import { awardPoints, getPointsConfig } from '../services/gamificationService';
import { AuthRequest } from '../middleware/auth';

const createReportSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  category: z.string().min(1),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  attachments: z.array(z.string()).optional(),
});

const updateReportSchema = createReportSchema.partial().extend({
  status: z.enum(['open', 'in-progress', 'resolved', 'closed']).optional(),
  assignedTo: z.string().optional(),
});

export const getReports = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id?.toString();
    const { status, category, severity } = req.query;

    const query: Record<string, unknown> = {};

    if (status) {
      query.status = status;
    }
    if (category) {
      query.category = category;
    }
    if (severity) {
      query.severity = severity;
    }

    // Usuários veem apenas seus próprios reportes, exceto se forem admin/supervisor
    // Por simplicidade, vamos permitir que vejam todos por enquanto
    // Em produção, adicionar verificação de role

    const reports = await Report.find(query)
      .populate('reportedBy', 'name email avatar')
      .populate('assignedTo', 'name email avatar')
      .populate('resolvedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar reportes' });
  }
};

export const getReportById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('reportedBy', 'name email avatar')
      .populate('assignedTo', 'name email avatar')
      .populate('resolvedBy', 'name email')
      .lean();

    if (!report) {
      res.status(404).json({ error: 'Reporte não encontrado' });
      return;
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar reporte' });
  }
};

export const createReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = createReportSchema.parse(req.body);
    const userId = req.user?._id?.toString();

    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    // Buscar utilizador para obter departamento
    const user = await User.findById(userId);
    const department = user?.department;

    // Calcular pontos baseado na severidade
    const severityMultiplier: Record<string, number> = {
      low: 0.5,
      medium: 1.0,
      high: 2.0,
      critical: 5.0,
    };

    const basePoints = await getPointsConfig('report_submitted', department);
    const finalPoints = Math.round(
      basePoints * (severityMultiplier[data.severity] || 1.0)
    );

    const report = new Report({
      ...data,
      reportedBy: userId,
      status: 'open',
      attachments: data.attachments || [],
      points: finalPoints,
    });

    await report.save();

    // Atribuir pontos ao utilizador que reportou
    if (finalPoints > 0) {
      await awardPoints({
        userId,
        amount: finalPoints,
        source: 'report_submitted',
        description: `Reporte submetido: ${report.title}`,
        metadata: {
          reportId: report._id.toString(),
          severity: report.severity,
          category: report.category,
        },
      });
    }
    await report.populate([
      { path: 'reportedBy', select: 'name email avatar' },
      { path: 'assignedTo', select: 'name email avatar' },
    ]);

    res.status(201).json(report);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      return;
    }
    res.status(500).json({ error: 'Erro ao criar reporte' });
  }
};

export const updateReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = updateReportSchema.parse(req.body);
    const userId = req.user?._id?.toString();

    const report = await Report.findById(req.params.id);

    if (!report) {
      res.status(404).json({ error: 'Reporte não encontrado' });
      return;
    }

    // Verificar permissões (criador ou supervisor/admin)
    if (report.reportedBy.toString() !== userId) {
      // Em produção, verificar se é supervisor/admin
      // Por enquanto, permitir atualização
    }

    Object.assign(report, data);

    // Se mudou para resolved, registrar timestamp e usuário
    if (data.status === 'resolved' && report.status !== 'resolved') {
      report.resolvedAt = new Date();
      report.resolvedBy = userId as unknown as typeof report.resolvedBy;
    }

    await report.save();
    await report.populate([
      { path: 'reportedBy', select: 'name email avatar' },
      { path: 'assignedTo', select: 'name email avatar' },
      { path: 'resolvedBy', select: 'name email' },
    ]);

    res.json(report);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      return;
    }
    res.status(500).json({ error: 'Erro ao atualizar reporte' });
  }
};

export const deleteReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id?.toString();
    const report = await Report.findById(req.params.id);

    if (!report) {
      res.status(404).json({ error: 'Reporte não encontrado' });
      return;
    }

    // Apenas criador pode deletar
    if (report.reportedBy.toString() !== userId) {
      res.status(403).json({ error: 'Sem permissão para deletar este reporte' });
      return;
    }

    await Report.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar reporte' });
  }
};

