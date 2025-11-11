import { motion } from 'framer-motion';
import { Trophy, Award, Star, TrendingUp, History } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Container from '../components/layout/Container';
import Card from '../components/ui/Card';
import PointsCounter from '../components/gamification/PointsCounter';
import LevelDisplay from '../components/gamification/LevelDisplay';
import BadgeDisplay from '../components/gamification/BadgeDisplay';
import ProgressBar from '../components/gamification/ProgressBar';
import StreakDisplay from '../components/gamification/StreakDisplay';
import CurrencyDisplay from '../components/gamification/CurrencyDisplay';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

interface Badge {
  _id: string;
  name: string;
  description: string;
  icon?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt?: Date;
}

export default function Gamification() {
  const { data: pointsData, isLoading: pointsLoading } = useQuery({
    queryKey: ['points'],
    queryFn: () => api.get<{ total: number }>('/api/gamification/points'),
  });

  const { data: levelData, isLoading: levelLoading } = useQuery({
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

  const { data: badgesData, isLoading: badgesLoading } = useQuery({
    queryKey: ['badges', 'user'],
    queryFn: () => api.get<{ badges: Badge[] }>('/api/gamification/badges/user'),
  });

  const { data: allBadgesData } = useQuery({
    queryKey: ['badges', 'all'],
    queryFn: () => api.get<{ badges: Badge[] }>('/api/gamification/badges'),
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

  const { data: pointsHistory } = useQuery({
    queryKey: ['points', 'history'],
    queryFn: () =>
      api.get<{ history: Array<{ amount: number; source: string; createdAt: string }> }>(
        '/api/gamification/points/history'
      ),
  });

  if (pointsLoading || levelLoading || badgesLoading) {
    return (
      <Layout>
        <LoadingSpinner fullScreen text="Carregando gamificação..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <Container>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Gamificação</h1>
          <p className="text-gray-600">Veja seu progresso e conquistas!</p>
        </motion.div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card variant="gamified" glow="purple">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Pontos Totais</p>
                  {pointsData ? (
                    <PointsCounter points={pointsData.total} size="lg" />
                  ) : (
                    <div className="text-3xl font-bold text-gradient-purple">0</div>
                  )}
                </div>
                <Trophy className="w-12 h-12 text-purple-600" />
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card variant="gamified" glow="blue">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Nível</p>
                  {levelData ? (
                    <div className="text-3xl font-bold text-blue-600">
                      {levelData.currentLevel}
                    </div>
                  ) : (
                    <div className="text-3xl font-bold text-blue-600">1</div>
                  )}
                </div>
                <Star className="w-12 h-12 text-blue-600" />
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card variant="gamified" glow="fire">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Sequência</p>
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
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card variant="gamified" glow="green">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Moeda Virtual</p>
                  {currencyData ? (
                    <CurrencyDisplay balance={currencyData.balance} size="lg" />
                  ) : (
                    <div className="text-3xl font-bold text-green-600">0</div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Level Progress */}
        {levelData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
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

        {/* Badges Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Badges</h2>
            <span className="text-sm text-gray-600">
              {badgesData?.badges?.length || 0} de {allBadgesData?.badges?.length || 0}{' '}
              conquistados
            </span>
          </div>

          {allBadgesData?.badges && allBadgesData.badges.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {allBadgesData.badges.map((badge, index) => {
                const earned = badgesData?.badges?.some((b) => b._id === badge._id) || false;
                return (
                  <motion.div
                    key={badge._id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 + index * 0.05 }}
                  >
                    <BadgeDisplay
                      name={badge.name}
                      description={badge.description}
                      icon={badge.icon}
                      rarity={badge.rarity as any}
                      earned={earned}
                      earnedAt={badge.earnedAt}
                      size="md"
                      showTooltip={true}
                    />
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <Card>
              <div className="text-center py-8 text-gray-500">
                Nenhum badge disponível ainda
              </div>
            </Card>
          )}
        </motion.div>

        {/* Points History */}
        {pointsHistory && pointsHistory.history && pointsHistory.history.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <History className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-bold text-gray-900">Histórico de Pontos</h2>
              </div>
              <div className="space-y-3">
                {pointsHistory.history.slice(0, 10).map((entry, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + index * 0.05 }}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{entry.source}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(entry.createdAt).toLocaleDateString('pt-PT')}
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

