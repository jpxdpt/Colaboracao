import { motion } from 'framer-motion';
import {
  User,
  Trophy,
  Award,
  TrendingUp,
  Calendar,
  Mail,
  Building2,
  Star,
  Flame,
  Coins,
  Target,
  CheckSquare,
  FileText,
  GraduationCap,
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import Container from '../components/layout/Container';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import PointsCounter from '../components/gamification/PointsCounter';
import LevelDisplay from '../components/gamification/LevelDisplay';
import StreakDisplay from '../components/gamification/StreakDisplay';
import BadgeDisplay from '../components/gamification/BadgeDisplay';
import ProgressBar from '../components/gamification/ProgressBar';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';

interface UserProfile {
  _id: string;
  email: string;
  name: string;
  department: string;
  role: string;
  avatar?: string;
  preferences: {
    notifications: Record<string, boolean>;
    theme: string;
    language: string;
    privacy: Record<string, boolean>;
  };
  createdAt: string;
}

interface Badge {
  _id: string;
  name: string;
  description: string;
  icon?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt?: string;
}

export default function Profile() {
  const user = useAuthStore((state) => state.user);

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get<UserProfile>('/api/auth/me'),
  });

  const { data: pointsData } = useQuery({
    queryKey: ['points'],
    queryFn: () => api.get<{ total: number }>('/api/gamification/points'),
  });

  const { data: levelData } = useQuery({
    queryKey: ['level-progress'],
    queryFn: () =>
      api.get<{
        currentLevel: number;
        nextLevel: number | null;
        pointsCurrent: number;
        pointsNext: number | null;
        progress: number;
      }>('/api/gamification/levels/progress'),
  });

  const { data: badgesData } = useQuery({
    queryKey: ['badges', 'user'],
    queryFn: () => api.get<{ badges: Badge[] }>('/api/gamification/badges/user'),
  });

  const { data: streakData } = useQuery({
    queryKey: ['streaks', 'daily_tasks'],
    queryFn: () =>
      api.get<{ consecutiveDays: number; atRisk?: boolean }>(
        '/api/gamification/streaks/daily_tasks'
      ),
  });

  const { data: currencyData } = useQuery({
    queryKey: ['currency'],
    queryFn: () => api.get<{ balance: number }>('/api/gamification/currency'),
  });

  const { data: kpisData } = useQuery({
    queryKey: ['kpis'],
    queryFn: () =>
      api.get<{
        tasks: {
          total: number;
          completed: number;
          completionRate: number;
        };
        goals: {
          total: number;
          completed: number;
          completionRate: number;
        };
        points: {
          total: number;
          earnedThisWeek: number;
          earnedThisMonth: number;
        };
        badges: {
          total: number;
        };
        streaks: {
          current: number;
          longest: number;
        };
      }>('/api/kpis'),
  });

  const { data: pointsHistory } = useQuery({
    queryKey: ['points', 'history'],
    queryFn: () =>
      api.get<{
        history: Array<{ amount: number; source: string; description?: string; timestamp: string }>;
      }>('/api/gamification/points/history?limit=20'),
  });

  if (profileLoading) {
    return (
      <Layout>
        <LoadingSpinner fullScreen text="Carregando perfil..." />
      </Layout>
    );
  }

  const profile = profileData || user;

  return (
    <Layout>
      <Container>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Perfil</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Veja suas estatísticas completas e conquistas!
          </p>
        </motion.div>

        {/* Profile Header Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card variant="gamified" glow="purple">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="relative">
                <img
                  src={
                    profile?.avatar ||
                    `https://ui-avatars.com/api/?name=${profile?.name || 'User'}&background=6366f1&color=fff&size=128`
                  }
                  alt={profile?.name || 'User'}
                  className="w-32 h-32 rounded-full border-4 border-purple-500 shadow-lg"
                />
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-purple rounded-full flex items-center justify-center border-4 border-white dark:border-gray-800">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {profile?.name || 'Utilizador'}
                </h2>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-4">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Mail className="w-4 h-4" />
                    <span>{profile?.email || ''}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Building2 className="w-4 h-4" />
                    <span>{profile?.department || ''}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Membro desde{' '}
                      {profile?.createdAt
                        ? new Date(profile.createdAt).toLocaleDateString('pt-PT', {
                            month: 'long',
                            year: 'numeric',
                          })
                        : ''}
                    </span>
                  </div>
                </div>
                {levelData && (
                  <div className="mt-4">
                    <LevelDisplay
                      currentLevel={levelData.currentLevel}
                      nextLevel={levelData.nextLevel}
                      progress={levelData.progress}
                      pointsCurrent={levelData.pointsCurrent}
                      pointsNext={levelData.pointsNext}
                    />
                  </div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card variant="gamified" glow="purple">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Pontos Totais</p>
                  {pointsData ? (
                    <PointsCounter points={pointsData.total} size="lg" />
                  ) : (
                    <div className="text-3xl font-bold text-gradient-purple">0</div>
                  )}
                </div>
                <Coins className="w-12 h-12 text-purple-600" />
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card variant="gamified" glow="fire">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Sequência</p>
                  {streakData && streakData.consecutiveDays > 0 ? (
                    <StreakDisplay
                      days={streakData.consecutiveDays}
                      atRisk={streakData.atRisk}
                      size="lg"
                      showLabel={false}
                    />
                  ) : (
                    <div className="text-3xl font-bold text-orange-600">0 dias</div>
                  )}
                </div>
                <Flame className="w-12 h-12 text-orange-600" />
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card variant="gamified" glow="green">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Badges</p>
                  <div className="text-3xl font-bold text-green-600">
                    {badgesData?.badges?.length || 0}
                  </div>
                </div>
                <Award className="w-12 h-12 text-green-600" />
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card variant="gamified" glow="blue">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Moeda Virtual</p>
                  <div className="text-3xl font-bold text-blue-600">
                    {currencyData?.balance || 0}
                  </div>
                </div>
                <Star className="w-12 h-12 text-blue-600" />
              </div>
            </Card>
          </motion.div>
        </div>

        {/* KPIs Section */}
        {kpisData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Estatísticas de Performance
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <div className="flex items-center gap-3 mb-3">
                  <CheckSquare className="w-6 h-6 text-blue-600" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Tarefas</h3>
                </div>
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {kpisData.tasks.completionRate.toFixed(1)}%
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {kpisData.tasks.completed} de {kpisData.tasks.total} completadas
                </p>
                <ProgressBar
                  progress={kpisData.tasks.completionRate}
                  color="blue"
                  className="mt-3"
                />
              </Card>

              <Card>
                <div className="flex items-center gap-3 mb-3">
                  <Target className="w-6 h-6 text-purple-600" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Metas</h3>
                </div>
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {kpisData.goals.completionRate.toFixed(1)}%
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {kpisData.goals.completed} de {kpisData.goals.total} completadas
                </p>
                <ProgressBar
                  progress={kpisData.goals.completionRate}
                  color="purple"
                  className="mt-3"
                />
              </Card>

              <Card>
                <div className="flex items-center gap-3 mb-3">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Pontos</h3>
                </div>
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {kpisData.points.total}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  +{kpisData.points.earnedThisWeek} esta semana • +{kpisData.points.earnedThisMonth}{' '}
                  este mês
                </p>
              </Card>
            </div>
          </motion.div>
        )}

        {/* Badges Section */}
        {badgesData && badgesData.badges && badgesData.badges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mb-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Badges Conquistados ({badgesData.badges.length})
            </h2>
            <Card>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {badgesData.badges.map((badge, index) => (
                  <motion.div
                    key={badge._id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 + index * 0.05 }}
                  >
                    <BadgeDisplay
                      name={badge.name}
                      description={badge.description}
                      icon={badge.icon}
                      rarity={badge.rarity}
                      earned={true}
                      earnedAt={badge.earnedAt}
                      size="md"
                      showTooltip={true}
                    />
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Points History */}
        {pointsHistory && pointsHistory.history && pointsHistory.history.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Histórico Recente de Pontos
            </h2>
            <Card>
              <div className="space-y-3">
                {pointsHistory.history.map((entry, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 + index * 0.05 }}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {entry.description || entry.source}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(entry.timestamp).toLocaleDateString('pt-PT', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <span className="text-lg font-bold text-purple-600">+{entry.amount}</span>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </Container>
    </Layout>
  );
}

