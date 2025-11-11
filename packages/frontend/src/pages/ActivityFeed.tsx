import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity as ActivityIcon,
  CheckSquare,
  Trophy,
  Flame,
  Target,
  TrendingUp,
  Coins,
  Users,
  Zap,
  Filter,
  RefreshCw,
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import Container from '../components/layout/Container';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';

interface ActivityUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface Activity {
  _id: string;
  user: ActivityUser | string;
  type: 'task_completed' | 'badge_earned' | 'streak_milestone' | 'goal_achieved' | 'level_up' | 'points_awarded' | 'team_joined' | 'challenge_completed';
  title: string;
  description: string;
  icon?: string;
  metadata?: {
    taskId?: string;
    badgeId?: string;
    streakDays?: number;
    goalId?: string;
    level?: number;
    points?: number;
    teamId?: string;
    challengeId?: string;
  };
  createdAt: string;
}

interface ActivityFeedResponse {
  success: boolean;
  data: Activity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'task_completed':
      return CheckSquare;
    case 'badge_earned':
      return Trophy;
    case 'streak_milestone':
      return Flame;
    case 'goal_achieved':
      return Target;
    case 'level_up':
      return TrendingUp;
    case 'points_awarded':
      return Coins;
    case 'team_joined':
      return Users;
    case 'challenge_completed':
      return Zap;
    default:
      return ActivityIcon;
  }
};

const getActivityColor = (type: Activity['type']) => {
  switch (type) {
    case 'task_completed':
      return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
    case 'badge_earned':
      return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
    case 'streak_milestone':
      return 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30';
    case 'goal_achieved':
      return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30';
    case 'level_up':
      return 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30';
    case 'points_awarded':
      return 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30';
    case 'team_joined':
      return 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30';
    case 'challenge_completed':
      return 'text-pink-600 dark:text-pink-400 bg-pink-100 dark:bg-pink-900/30';
    default:
      return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30';
  }
};

export default function ActivityFeed() {
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState<string>('all');

  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const token = useAuthStore((state) => state.token);
  const isReady = hasHydrated && !!user && !!token;

  const queryParams = new URLSearchParams();
  queryParams.set('page', page.toString());
  queryParams.set('limit', '30');
  if (filterType !== 'all') {
    queryParams.set('type', filterType);
  }

  const { data: feedResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['activity-feed', queryParams.toString()],
    queryFn: () => api.get<ActivityFeedResponse>(`/api/activities/feed?${queryParams.toString()}`),
    enabled: isReady,
    retry: false,
    refetchInterval: 30000, // Refetch a cada 30 segundos para "tempo real"
  });

  const activities = feedResponse?.data || [];
  const pagination = feedResponse?.pagination;

  const activityTypes = [
    { value: 'all', label: 'Todas' },
    { value: 'task_completed', label: 'Tarefas Completadas' },
    { value: 'badge_earned', label: 'Badges Ganhos' },
    { value: 'streak_milestone', label: 'Marcos de Sequência' },
    { value: 'goal_achieved', label: 'Metas Alcançadas' },
    { value: 'level_up', label: 'Subidas de Nível' },
    { value: 'points_awarded', label: 'Pontos Atribuídos' },
    { value: 'team_joined', label: 'Juntou-se a Equipas' },
    { value: 'challenge_completed', label: 'Desafios Completados' },
  ];

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - activityDate.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'há poucos segundos';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `há ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `há ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `há ${days} ${days === 1 ? 'dia' : 'dias'}`;
    } else {
      return activityDate.toLocaleDateString('pt-PT', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  return (
    <Layout>
      <Container>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Feed de Atividades
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Acompanhe as conquistas e atividades em tempo real
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Button
              variant="secondary"
              icon={<RefreshCw className="w-5 h-5" />}
              onClick={() => refetch()}
              disabled={isLoading}
            >
              Atualizar
            </Button>
          </motion.div>
        </div>

        {/* Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Filtrar por tipo:
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {activityTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => {
                    setFilterType(type.value);
                    setPage(1);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterType === type.value
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Activities Feed */}
        {isLoading ? (
          <LoadingSpinner fullScreen text="Carregando atividades..." />
        ) : error ? (
          <EmptyState
            icon={ActivityIcon}
            title="Erro ao carregar atividades"
            description={error instanceof Error ? error.message : 'Erro desconhecido'}
          />
        ) : activities.length === 0 ? (
          <EmptyState
            icon={ActivityIcon}
            title="Nenhuma atividade encontrada"
            description={
              filterType !== 'all'
                ? 'Tente ajustar os filtros'
                : 'Ainda não há atividades no feed'
            }
          />
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => {
              const activityUser = typeof activity.user === 'object' ? activity.user : null;
              const IconComponent = getActivityIcon(activity.type);
              const colorClasses = getActivityColor(activity.type);

              return (
                <motion.div
                  key={activity._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card variant="interactive" className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${colorClasses}`}
                      >
                        {activity.icon ? (
                          <span className="text-2xl">{activity.icon}</span>
                        ) : (
                          <IconComponent className="w-6 h-6" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                              {activity.title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {activity.description}
                            </p>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {formatTimeAgo(activity.createdAt)}
                          </span>
                        </div>

                        {/* User Info */}
                        {activityUser && (
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <img
                              src={
                                activityUser.avatar ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  activityUser.name || activityUser.email
                                )}&background=random`
                              }
                              alt={activityUser.name}
                              className="w-6 h-6 rounded-full"
                            />
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {activityUser.name}
                            </span>
                          </div>
                        )}

                        {/* Metadata */}
                        {activity.metadata && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {activity.metadata.points && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded">
                                <Coins className="w-3 h-3" />
                                {activity.metadata.points} pontos
                              </span>
                            )}
                            {activity.metadata.streakDays && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs rounded">
                                <Flame className="w-3 h-3" />
                                {activity.metadata.streakDays} dias
                              </span>
                            )}
                            {activity.metadata.level && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded">
                                <TrendingUp className="w-3 h-3" />
                                Nível {activity.metadata.level}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.page === 1 || isLoading}
            >
              Anterior
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Página {pagination.page} de {pagination.pages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={pagination.page === pagination.pages || isLoading}
            >
              Próxima
            </Button>
          </div>
        )}
      </Container>
    </Layout>
  );
}

