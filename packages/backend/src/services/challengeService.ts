import { Challenge, ChallengeTeamProgress, Team, TeamMember, User } from '../models';
import { awardPoints } from './gamificationService';
import { addTransaction } from './currencyService';
import mongoose from 'mongoose';

/**
 * Atualiza o progresso de uma equipa num desafio
 */
export const updateTeamChallengeProgress = async (
  challengeId: string,
  teamId: string,
  objectiveType: string,
  amount: number
): Promise<void> => {
  const challenge = await Challenge.findById(challengeId);
  if (!challenge || !challenge.teamBased) {
    return;
  }

  // Buscar ou criar progresso da equipa
  let teamProgress = await ChallengeTeamProgress.findOne({
    challenge: challengeId,
    team: teamId,
  });

  if (!teamProgress) {
    // Criar progresso inicial
    teamProgress = new ChallengeTeamProgress({
      challenge: challengeId,
      team: teamId,
      progress: challenge.objectives.map((_, index) => ({
        objectiveIndex: index,
        current: 0,
        completed: false,
      })),
      totalProgress: 0,
      completed: false,
    });
  }

  // Atualizar progresso para cada objetivo que corresponde ao tipo
  let allCompleted = true;
  let totalProgress = 0;

  for (let i = 0; i < challenge.objectives.length; i++) {
    const objective = challenge.objectives[i];
    if (objective.type === objectiveType) {
      const progressItem = teamProgress.progress.find((p) => p.objectiveIndex === i);
      if (progressItem) {
        progressItem.current = Math.min(progressItem.current + amount, objective.target);
        progressItem.completed = progressItem.current >= objective.target;
      }
    }

    const progressItem = teamProgress.progress.find((p) => p.objectiveIndex === i);
    if (progressItem) {
      totalProgress += progressItem.current;
      if (!progressItem.completed) {
        allCompleted = false;
      }
    }
  }

  teamProgress.totalProgress = totalProgress;
  teamProgress.completed = allCompleted;

  if (allCompleted && !teamProgress.completedAt) {
    teamProgress.completedAt = new Date();
  }

  await teamProgress.save();

  // Atualizar ranking
  await updateTeamChallengeRanking(challengeId);
};

/**
 * Atualiza o ranking de equipas num desafio
 */
export const updateTeamChallengeRanking = async (challengeId: string): Promise<void> => {
  const teamProgresses = await ChallengeTeamProgress.find({ challenge: challengeId })
    .sort({ totalProgress: -1, completedAt: 1 }) // Ordenar por progresso total (desc) e data de conclusão (asc)
    .lean();

  // Atualizar ranks
  for (let i = 0; i < teamProgresses.length; i++) {
    await ChallengeTeamProgress.updateOne(
      { _id: teamProgresses[i]._id },
      { rank: i + 1 }
    );
  }
};

/**
 * Distribui recompensas automaticamente quando um desafio termina
 */
export const distributeChallengeRewards = async (challengeId: string): Promise<void> => {
  const challenge = await Challenge.findById(challengeId);
  if (!challenge || challenge.rewardsDistributed) {
    return;
  }

  if (challenge.teamBased) {
    // Distribuir recompensas para equipas baseado no ranking
    const teamProgresses = await ChallengeTeamProgress.find({ challenge: challengeId })
      .sort({ rank: 1 })
      .populate('team')
      .lean();

    for (const teamProgress of teamProgresses) {
      const team = await Team.findById(teamProgress.team).populate('members').lean();
      if (!team) continue;

      // Buscar membros ativos da equipa
      const activeMembers = await TeamMember.find({
        team: teamProgress.team,
        active: true,
      }).lean();

      // Calcular recompensas baseado na posição
      const position = teamProgress.rank || teamProgresses.length;
      const rewardMultiplier = getRewardMultiplier(position, teamProgresses.length);

      // Distribuir pontos para cada membro
      if (challenge.rewards.points && challenge.rewards.points > 0) {
        const pointsPerMember = Math.round(
          (challenge.rewards.points * rewardMultiplier) / activeMembers.length
        );

        for (const member of activeMembers) {
          await awardPoints({
            userId: member.user.toString(),
            amount: pointsPerMember,
            source: 'challenge_reward',
            description: `Recompensa do desafio "${challenge.title}" - Equipa em ${position}º lugar`,
            metadata: {
              challengeId: challengeId,
              teamId: teamProgress.team.toString(),
              position,
            },
          });
        }
      }

      // Distribuir moeda virtual
      if (challenge.rewards.currency && challenge.rewards.currency > 0) {
        const currencyPerMember = Math.round(
          (challenge.rewards.currency * rewardMultiplier) / activeMembers.length
        );

        for (const member of activeMembers) {
          await addTransaction({
            userId: member.user.toString(),
            type: 'earn',
            amount: currencyPerMember,
            source: 'challenge_reward',
            description: `Recompensa do desafio "${challenge.title}" - Equipa em ${position}º lugar`,
            metadata: {
              challengeId: challengeId,
              teamId: teamProgress.team.toString(),
              position,
            },
          });
        }
      }
    }
  } else {
    // Distribuir recompensas para utilizadores individuais
    const userProgresses = await ChallengeTeamProgress.find({
      challenge: challengeId,
      completed: true,
    })
      .populate('user')
      .lean();

    const typedUserProgresses = userProgresses as unknown as Array<{ user: mongoose.Types.ObjectId }>;

    for (const userProgress of typedUserProgresses) {
      const userId = userProgress.user.toString();

      // Pontos
      if (challenge.rewards.points && challenge.rewards.points > 0) {
        await awardPoints({
          userId,
          amount: challenge.rewards.points,
          source: 'challenge_reward',
          description: `Recompensa do desafio "${challenge.title}"`,
          metadata: {
            challengeId: challengeId,
          },
        });
      }

      // Moeda virtual
      if (challenge.rewards.currency && challenge.rewards.currency > 0) {
        await addTransaction({
          userId,
          type: 'earn',
          amount: challenge.rewards.currency,
          source: 'challenge_reward',
          description: `Recompensa do desafio "${challenge.title}"`,
          metadata: {
            challengeId: challengeId,
          },
        });
      }
    }
  }

  // Marcar recompensas como distribuídas
  challenge.rewardsDistributed = true;
  await challenge.save();
};

/**
 * Calcula multiplicador de recompensa baseado na posição
 */
const getRewardMultiplier = (position: number, totalTeams: number): number => {
  if (position === 1) return 1.0; // 1º lugar: 100%
  if (position === 2) return 0.7; // 2º lugar: 70%
  if (position === 3) return 0.5; // 3º lugar: 50%
  if (position <= Math.ceil(totalTeams * 0.5)) return 0.3; // Top 50%: 30%
  return 0.1; // Resto: 10%
};

/**
 * Junta uma equipa a um desafio
 */
export const joinTeamToChallenge = async (
  challengeId: string,
  teamId: string
): Promise<void> => {
  const challenge = await Challenge.findById(challengeId);
  if (!challenge || !challenge.teamBased) {
    throw new Error('Desafio não é baseado em equipas');
  }

  // Verificar se equipa já participa
  if (challenge.participatingTeams?.includes(teamId as unknown as typeof challenge.participatingTeams[0])) {
    return;
  }

  // Adicionar equipa ao desafio
  if (!challenge.participatingTeams) {
    challenge.participatingTeams = [];
  }
  challenge.participatingTeams.push(teamId as unknown as typeof challenge.participatingTeams[0]);
  await challenge.save();

  // Criar progresso inicial da equipa
  const teamProgress = new ChallengeTeamProgress({
    challenge: challengeId,
    team: teamId,
    progress: challenge.objectives.map((_, index) => ({
      objectiveIndex: index,
      current: 0,
      completed: false,
    })),
    totalProgress: 0,
    completed: false,
  });

  await teamProgress.save();

  // Adicionar desafio à lista de desafios ativos da equipa
  await Team.findByIdAndUpdate(teamId, {
    $addToSet: { activeChallenges: challengeId },
  });
};

