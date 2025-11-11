import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  Target,
  FileText,
  GraduationCap,
  Trophy,
  TrendingUp,
  Flame,
  Coins,
  BarChart3,
  Clock,
  Zap,
  Award,
} from 'lucide-react';
import { useGamificationStore } from '../stores/gamificationStore';
import { useAuthStore } from '../stores/authStore';
import { api } from '../services/api';
import { useQuery } from '@tanstack/react-query';
import Layout from '../components/layout/Layout';
import Container from '../components/layout/Container';
import Card from '../components/ui/Card';
import PointsCounter from '../components/gamification/PointsCounter';
import LevelDisplay from '../components/gamification/LevelDisplay';
import StreakDisplay from '../components/gamification/StreakDisplay';
import ProgressBar from '../components/gamification/ProgressBar';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function Dashboard() {
  const navigate = useNavigate();
  const { setTotalPoints, setLevelProgress, totalPoints, levelProgress } =
    useGamificationStore();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const isAuthenticated = !!(user && token);
  
  // Aguardar hidratação do store antes de fazer queries
  const isReady = hasHydrated && !!user && !!token;
  
  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (hasHydrated && (!isAuthenticated || !token)) {
      navigate('/login');
    }
  }, [hasHydrated, isAuthenticated, token, navigate]);

  const { data: pointsData, isLoading: pointsLoading, error: pointsError } = useQuery({
    queryKey: ['points'],
    queryFn: async () => {
      const response = await api.get<{ total: number } | { data: { total: number } }>('/api/gamification/points');
      // Handle both response formats
      if ('data' in response && response.data) {
        return { total: response.data.total };
      }
      return response as { total: number };
    },
    enabled: isReady,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const { data: levelData, isLoading: levelLoading, error: levelError } = useQuery({
    queryKey: ['level-progress'],
    queryFn: async () => {
      const response = await api.get<{
        currentLevel: number;
        nextLevel: number | null;
        pointsCurrent: number;
        pointsNext: number | null;
        progress: number;
      } | { data: {
        currentLevel: number;
        nextLevel: number | null;
        pointsCurrent: number;
        pointsNext: number | null;
        progress: number;
      } }>('/api/gamification/levels/progress');
      // Handle both response formats
      if ('data' in response && response.data) {
        return response.data;
      }
      return response as {
        currentLevel: number;
        nextLevel: number | null;
        pointsCurrent: number;
        pointsNext: number | null;
        progress: number;
      };
    },
    enabled: isReady,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const { data: streakData, error: streakError } = useQuery({
    queryKey: ['streaks', 'daily_tasks'],
    queryFn: async () => {
      const response = await api.get<{ consecutiveDays: number; atRisk?: boolean } | { data: { consecutiveDays: number; atRisk?: boolean } }>(
        '/api/gamification/streaks/daily_tasks'
      );
      if ('data' in response && response.data) {
        return response.data;
      }
      return response as { consecutiveDays: number; atRisk?: boolean };
    },
    enabled: isReady,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const { data: badgesData, error: badgesError } = useQuery({
    queryKey: ['badges', 'user'],
    queryFn: async () => {
      const response = await api.get<{ badges: unknown[] } | { data: { badges: unknown[] } }>('/api/gamification/badges/user');
      if ('data' in response && response.data) {
        return response.data;
      }
      return response as { badges: unknown[] };
    },
    enabled: isReady,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const { data: kpisData, isLoading: kpisLoading } = useQuery({
    queryKey: ['kpis'],
    queryFn: () => api.get<{
      tasks: {
        total: number;
        completed: number;
        completedThisWeek: number;
        completedThisMonth: number;
        completionRate: number;
        averageCompletionTime: number;
      };
      points: {
        total: number;
        earnedThisWeek: number;
        earnedThisMonth: number;
        averagePerDay: number;
      };
      badges: {
        total: number;
        earnedThisWeek: number;
        earnedThisMonth: number;
      };
      streaks: {
        current: number;
        longest: number;
        activeStreaks: number;
      };
      goals: {
        total: number;
        completed: number;
        inProgress: number;
        completionRate: number;
      };
      productivity: {
        tasksPerDay: number;
        pointsPerDay: number;
        activeDays: number;
      };
    }>('/api/kpis'),
    enabled: isReady,
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (pointsData) {
      setTotalPoints(pointsData.total);
    }
  }, [pointsData, setTotalPoints]);

  useEffect(() => {
    if (levelData) {
      setLevelProgress(levelData);
    }
  }, [levelData, setLevelProgress]);

  const quickActions = [
    {
      icon: CheckSquare,
      title: 'Tarefas',
      description: 'Gerir suas tarefas',
      link: '/tasks',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Target,
      title: 'Metas',
      description: 'Acompanhar suas metas',
      link: '/goals',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: FileText,
      title: 'Reportes',
      description: 'Submeter reportes',
      link: '/reports',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: GraduationCap,
      title: 'Formação',
      description: 'Aprender e crescer',
      link: '/training',
      color: 'from-orange-500 to-red-500',
    },
  ];

  // Show loading only on initial load
  const isInitialLoading = pointsLoading && levelLoading;

  return (
    <Layout>
      <Container>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-1">Dashboard</h1>
          <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">Bem-vindo de volta! Continue sua jornada gamificada.</p>
        </motion.div>

        {isInitialLoading && (
          <LoadingSpinner text="Carregando dashboard..." />
        )}

        {/* Stats Cards */}
        {!isInitialLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Points */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card variant="gamified" className="p-5" glow="purple">
                <div className="flex items-center justify-between gap-5">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                      Pontos Totais
                    </span>
                    {pointsData && pointsData.total !== undefined ? (
                      <PointsCounter points={pointsData.total} size="lg" />
                    ) : (
                      <span className="text-3xl font-bold leading-none text-gradient-purple">0</span>
                    )}
                  </div>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-glow-purple"
                    style={{ backgroundImage: 'var(--gradient-purple)' }}
                  >
                    <Coins className="w-7 h-7 text-white" />
                  </div>
                </div>
                {pointsError && (
                  <p className="text-xs text-red-500 mt-2">Erro ao carregar pontos</p>
                )}
              </Card>
            </motion.div>

            {/* Level */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card variant="gamified" className="p-5" glow="blue">
                <div className="flex items-center justify-between gap-5">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                      Nível Atual
                    </span>
                    <span className="text-3xl font-bold leading-none text-[var(--color-text-primary)]">
                      {levelData?.currentLevel ?? 1}
                    </span>
                  </div>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-glow-blue"
                    style={{ backgroundImage: 'var(--gradient-blue)' }}
                  >
                    <Trophy className="w-7 h-7 text-white" />
                  </div>
                </div>
                {levelError && (
                  <p className="text-xs text-red-500 mt-2">Erro ao carregar nível</p>
                )}
              </Card>
            </motion.div>

            {/* Streak */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card variant="gamified" className="p-5" glow="fire">
                <div className="flex items-center justify-between gap-5">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                      Sequência
                    </span>
                    <span className="text-3xl font-bold leading-none text-gradient-fire">
                      {streakData?.consecutiveDays ?? 0}
                      <span className="ml-1 text-base font-semibold text-orange-300">dia</span>
                    </span>
                  </div>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-glow-fire"
                    style={{ backgroundImage: 'var(--gradient-fire)' }}
                  >
                    <Flame className="w-7 h-7 text-white" />
                  </div>
                </div>
                {streakError && (
                  <p className="text-xs text-red-500 mt-2">Erro ao carregar sequência</p>
                )}
              </Card>
            </motion.div>

            {/* Badges */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Card variant="gamified" className="p-5" glow="green">
                <div className="flex items-center justify-between gap-5">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                      Badges
                    </span>
                    <span className="text-3xl font-bold leading-none text-[var(--color-text-primary)]">
                      {badgesData?.badges?.length || 0}
                    </span>
                  </div>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-glow-blue"
                    style={{ backgroundImage: 'var(--gradient-success)' }}
                  >
                    <Trophy className="w-7 h-7 text-white" />
                  </div>
                </div>
                {badgesError && (
                  <p className="text-xs text-red-500 mt-2">Erro ao carregar badges</p>
                )}
              </Card>
            </motion.div>
          </div>
        )}

        {/* Level Progress */}
        {!isInitialLoading && levelData && levelData.nextLevel && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-6"
          >
            <Card>
              <LevelDisplay
                currentLevel={levelData.currentLevel}
                nextLevel={levelData.nextLevel}
                progress={levelData.progress}
                pointsCurrent={levelData.pointsCurrent}
                pointsNext={levelData.pointsNext}
              />
            </Card>
          </motion.div>
        )}

        {/* KPIs Section */}
        {!isInitialLoading && kpisData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-6"
          >
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Indicadores de Performance (KPIs)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Taxa de Conclusão de Tarefas */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-[var(--color-text-primary)]">
                    <CheckSquare className="w-5 h-5 text-blue-400" />
                    <h3 className="text-base font-semibold">Taxa de Conclusão</h3>
                  </div>
                </div>
                <div className="text-3xl font-bold leading-none text-blue-400 mb-1">
                  {kpisData.tasks.completionRate.toFixed(1)}%
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {kpisData.tasks.completed} de {kpisData.tasks.total} tarefas completadas
                </p>
                <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
                    <span>Esta semana: {kpisData.tasks.completedThisWeek}</span>
                    <span>Este mês: {kpisData.tasks.completedThisMonth}</span>
                  </div>
                </div>
              </Card>

              {/* Produtividade */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-[var(--color-text-primary)]">
                    <Zap className="w-5 h-5 text-amber-400" />
                    <h3 className="text-base font-semibold">Produtividade</h3>
                  </div>
                </div>
                <div className="text-3xl font-bold leading-none text-amber-400 mb-1">
                  {kpisData.productivity.tasksPerDay.toFixed(1)}
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Tarefas por dia (média 30 dias)
                </p>
                <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
                    <span>Dias ativos: {kpisData.productivity.activeDays}</span>
                    <span>{kpisData.productivity.pointsPerDay.toFixed(1)} pts/dia</span>
                  </div>
                </div>
              </Card>

              {/* Tempo Médio de Conclusão */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-[var(--color-text-primary)]">
                    <Clock className="w-5 h-5 text-purple-400" />
                    <h3 className="text-base font-semibold">Tempo Médio</h3>
                  </div>
                </div>
                <div className="text-3xl font-bold leading-none text-purple-400 mb-1">
                  {kpisData.tasks.averageCompletionTime > 0
                    ? kpisData.tasks.averageCompletionTime.toFixed(1)
                    : '0'}h
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Tempo médio para completar tarefas
                </p>
              </Card>

              {/* Pontos Ganhos */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-[var(--color-text-primary)]">
                    <Coins className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-base font-semibold">Pontos Ganhos</h3>
                  </div>
                </div>
                <div className="text-3xl font-bold leading-none text-emerald-400 mb-1">
                  {kpisData.points.total}
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Total de pontos acumulados
                </p>
                <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
                    <span>Esta semana: +{kpisData.points.earnedThisWeek}</span>
                    <span>Este mês: +{kpisData.points.earnedThisMonth}</span>
                  </div>
                </div>
              </Card>

              {/* Metas */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-[var(--color-text-primary)]">
                    <Target className="w-5 h-5 text-rose-400" />
                    <h3 className="text-base font-semibold">Metas</h3>
                  </div>
                </div>
                <div className="text-3xl font-bold leading-none text-rose-400 mb-1">
                  {kpisData.goals.completionRate.toFixed(1)}%
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {kpisData.goals.completed} de {kpisData.goals.total} metas completadas
                </p>
                <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    Em progresso: {kpisData.goals.inProgress}
                  </div>
                </div>
              </Card>

              {/* Streaks */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-[var(--color-text-primary)]">
                    <Flame className="w-5 h-5 text-orange-400" />
                    <h3 className="text-base font-semibold">Sequências</h3>
                  </div>
                </div>
                <div className="text-3xl font-bold leading-none text-orange-400 mb-1">
                  {kpisData.streaks.current}
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Sequência atual (dias)
                </p>
                <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
                    <span>Recorde: {kpisData.streaks.longest} dias</span>
                    <span>Ativas: {kpisData.streaks.activeStreaks}</span>
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        {!isInitialLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">Ações Rápidas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.link}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                >
                  <Link to={action.link}>
                    <Card variant="interactive" glow="purple" className="p-5">
                      <div className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center mb-4 shadow-soft`}>
                        <action.icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">{action.title}</h3>
                      <p className="text-sm text-[var(--color-text-secondary)]">{action.description}</p>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </Container>
    </Layout>
  );
}
