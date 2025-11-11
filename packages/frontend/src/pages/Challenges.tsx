import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Clock,
  Users,
  Award,
  Coins,
  Star,
  Calendar,
  Target,
  CheckCircle2,
  Play,
  XCircle,
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import Container from '../components/layout/Container';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ProgressBar from '../components/gamification/ProgressBar';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

interface Challenge {
  _id: string;
  title: string;
  description: string;
  type: 'weekly' | 'monthly' | 'special';
  startDate: string;
  endDate: string;
  objectives: Array<{
    type: string;
    target: number;
    description: string;
  }>;
  rewards: {
    badges?: Array<{ _id: string; name: string; icon?: string }>;
    currency?: number;
    points?: number;
    realRewards?: string[];
  };
  participants: Array<{
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  }>;
  status: 'upcoming' | 'active' | 'ended';
  createdAt: string;
}

interface ChallengeProgress {
  _id: string;
  challenge: Challenge;
  progress: Array<{
    objectiveIndex: number;
    current: number;
    completed: boolean;
  }>;
  completed: boolean;
  completedAt?: string;
}

export default function Challenges() {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  const { data: challenges, isLoading } = useQuery({
    queryKey: ['challenges', selectedStatus],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus);
      }
      return api.get<Challenge[]>(
        `/api/gamification/challenges${params.toString() ? `?${params.toString()}` : ''}`
      );
    },
  });

  const joinChallengeMutation = useMutation({
    mutationFn: (challengeId: string) =>
      api.post(`/api/gamification/challenges/${challengeId}/join`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      toast.success('Você se juntou ao desafio!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao participar no desafio');
    },
  });

  const { data: progressData } = useQuery({
    queryKey: ['challenge-progress', selectedChallenge?._id],
    queryFn: () =>
      api.get<ChallengeProgress>(
        `/api/gamification/challenges/${selectedChallenge?._id}/progress`
      ),
    enabled: !!selectedChallenge && selectedChallenge.participants.some((p) => p._id === user?.id),
  });

  const calculateTimeRemaining = (endDate: string) => {
    const now = new Date().getTime();
    const end = new Date(endDate).getTime();
    const difference = end - now;

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((difference % (1000 * 60)) / 1000),
      expired: false,
    };
  };

  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
  } | null>(null);

  useEffect(() => {
    if (selectedChallenge && selectedChallenge.status === 'active') {
      const updateTimer = () => {
        setTimeRemaining(calculateTimeRemaining(selectedChallenge.endDate));
      };
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [selectedChallenge]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'upcoming':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'ended':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'weekly':
        return 'Semanal';
      case 'monthly':
        return 'Mensal';
      case 'special':
        return 'Especial';
      default:
        return type;
    }
  };

  const isParticipating = (challenge: Challenge) => {
    return challenge.participants.some((p) => p._id === user?.id);
  };

  const handleViewDetails = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setShowDetailsModal(true);
  };

  const handleJoinChallenge = (challengeId: string) => {
    joinChallengeMutation.mutate(challengeId);
  };

  const calculateOverallProgress = (challenge: Challenge, progress?: ChallengeProgress) => {
    if (!progress || !challenge.objectives.length) return 0;
    const completed = progress.progress.filter((p) => p.completed).length;
    return (completed / challenge.objectives.length) * 100;
  };

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner fullScreen text="Carregando desafios..." />
      </Layout>
    );
  }

  const challengesList = challenges || [];

  return (
    <Layout>
      <Container>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Desafios</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Participe em desafios temporários e ganhe recompensas exclusivas!
          </p>
        </motion.div>

        {/* Status Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex gap-2 flex-wrap">
            {['all', 'active', 'upcoming', 'ended'].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  selectedStatus === status
                    ? 'bg-gradient-purple text-white shadow-glow-purple scale-105'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                {status === 'all' && 'Todos'}
                {status === 'active' && 'Ativos'}
                {status === 'upcoming' && 'Próximos'}
                {status === 'ended' && 'Finalizados'}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Challenges Grid */}
        {challengesList.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="Nenhum desafio disponível"
            description="Novos desafios serão adicionados em breve!"
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {challengesList.map((challenge, index) => {
              const isParticipant = isParticipating(challenge);
              const timeLeft = calculateTimeRemaining(challenge.endDate);

              return (
                <motion.div
                  key={challenge._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                >
                  <Card variant="gamified" glow={challenge.status === 'active' ? 'purple' : undefined}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Trophy className="w-6 h-6 text-purple-600" />
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {challenge.title}
                          </h3>
                        </div>
                        <span
                          className={`inline-block px-3 py-1 rounded-lg text-xs font-semibold border ${getStatusColor(
                            challenge.status
                          )}`}
                        >
                          {getTypeLabel(challenge.type)} • {challenge.status === 'active' ? 'Ativo' : challenge.status === 'upcoming' ? 'Próximo' : 'Finalizado'}
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                      {challenge.description}
                    </p>

                    {/* Countdown */}
                    {challenge.status === 'active' && !timeLeft.expired && (
                      <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                            Tempo Restante
                          </span>
                        </div>
                        <div className="flex gap-3 text-sm">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                              {timeLeft.days}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">dias</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                              {timeLeft.hours}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">horas</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                              {timeLeft.minutes}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">min</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Objectives */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {challenge.objectives.length} Objetivos
                        </span>
                      </div>
                      <div className="space-y-1">
                        {challenge.objectives.slice(0, 2).map((objective, idx) => (
                          <div
                            key={idx}
                            className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2"
                          >
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                            {objective.description}
                          </div>
                        ))}
                        {challenge.objectives.length > 2 && (
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            +{challenge.objectives.length - 2} mais objetivos
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Rewards */}
                    <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">
                          Recompensas
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {challenge.rewards.points && (
                          <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">
                            +{challenge.rewards.points} pontos
                          </span>
                        )}
                        {challenge.rewards.currency && (
                          <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                            +{challenge.rewards.currency} moedas
                          </span>
                        )}
                        {challenge.rewards.badges && challenge.rewards.badges.length > 0 && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                            {challenge.rewards.badges.length} badge(s)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Participants */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Users className="w-4 h-4" />
                        <span>{challenge.participants.length} participantes</span>
                      </div>
                      {isParticipant && (
                        <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                          Participando
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={() => handleViewDetails(challenge)}
                      >
                        Ver Detalhes
                      </Button>
                      {!isParticipant && challenge.status === 'active' && (
                        <Button
                          variant="gamified"
                          onClick={() => handleJoinChallenge(challenge._id)}
                          disabled={joinChallengeMutation.isPending}
                          icon={<Play className="w-4 h-4" />}
                        >
                          Participar
                        </Button>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Challenge Details Modal */}
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedChallenge(null);
          }}
          title={selectedChallenge?.title || 'Detalhes do Desafio'}
          size="lg"
        >
          {selectedChallenge && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Descrição</h3>
                <p className="text-gray-600 dark:text-gray-400">{selectedChallenge.description}</p>
              </div>

              {/* Countdown */}
              {selectedChallenge.status === 'active' && timeRemaining && !timeRemaining.expired && (
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-purple-700 dark:text-purple-300">
                      Tempo Restante
                    </h3>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-3xl font-bold text-purple-600">{timeRemaining.days}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Dias</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-purple-600">
                        {timeRemaining.hours}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Horas</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-purple-600">
                        {timeRemaining.minutes}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Minutos</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-purple-600">
                        {timeRemaining.seconds}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Segundos</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Objectives */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Objetivos</h3>
                <div className="space-y-3">
                  {selectedChallenge.objectives.map((objective, idx) => {
                    const progress = progressData?.progress.find(
                      (p) => p.objectiveIndex === idx
                    );
                    const isCompleted = progress?.completed || false;
                    const current = progress?.current || 0;

                    return (
                      <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            ) : (
                              <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                            )}
                            <span className="font-medium text-gray-900 dark:text-white">
                              {objective.description}
                            </span>
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {current} / {objective.target}
                          </span>
                        </div>
                        <ProgressBar
                          progress={Math.min((current / objective.target) * 100, 100)}
                          color={isCompleted ? 'green' : 'purple'}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Rewards */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Recompensas</h3>
                <div className="grid grid-cols-2 gap-3">
                  {selectedChallenge.rewards.points && (
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-purple-600" />
                        <span className="font-semibold text-purple-700 dark:text-purple-300">
                          {selectedChallenge.rewards.points} Pontos
                        </span>
                      </div>
                    </div>
                  )}
                  {selectedChallenge.rewards.currency && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Coins className="w-5 h-5 text-green-600" />
                        <span className="font-semibold text-green-700 dark:text-green-300">
                          {selectedChallenge.rewards.currency} Moedas
                        </span>
                      </div>
                    </div>
                  )}
                  {selectedChallenge.rewards.badges &&
                    selectedChallenge.rewards.badges.map((badge) => (
                      <div
                        key={badge._id}
                        className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <Award className="w-5 h-5 text-blue-600" />
                          <span className="font-semibold text-blue-700 dark:text-blue-300">
                            {badge.name}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Dates */}
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Início: {new Date(selectedChallenge.startDate).toLocaleDateString('pt-PT')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Fim: {new Date(selectedChallenge.endDate).toLocaleDateString('pt-PT')}
                  </span>
                </div>
              </div>

              {/* Action */}
              {!isParticipating(selectedChallenge) && selectedChallenge.status === 'active' && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="gamified"
                    className="w-full"
                    onClick={() => {
                      handleJoinChallenge(selectedChallenge._id);
                      setShowDetailsModal(false);
                    }}
                    disabled={joinChallengeMutation.isPending}
                    icon={<Play className="w-5 h-5" />}
                  >
                    Participar no Desafio
                  </Button>
                </div>
              )}
            </div>
          )}
        </Modal>
      </Container>
    </Layout>
  );
}

