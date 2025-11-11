import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, TrendingUp, Crown, Star, User } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Container from '../components/layout/Container';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { RankingType } from '@gamify/shared';

interface RankingEntry {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  points: number;
  position: number;
  type: RankingType;
  periodStart: string;
  periodEnd: string;
}

interface UserRanking {
  position: number;
  points: number;
  type: RankingType;
  periodStart: string;
  periodEnd: string;
}

export default function Rankings() {
  const [selectedType, setSelectedType] = useState<RankingType>(RankingType.WEEKLY);
  const user = useAuthStore((state) => state.user);

  const { data: rankingsData, isLoading: rankingsLoading } = useQuery({
    queryKey: ['rankings', selectedType],
    queryFn: () =>
      api.get<{ rankings: RankingEntry[]; type: RankingType; periodStart: string; periodEnd: string }>(
        `/api/gamification/rankings?type=${selectedType}&limit=100`
      ),
  });

  const { data: userRankingData, isLoading: userRankingLoading } = useQuery({
    queryKey: ['rankings', 'user', selectedType],
    queryFn: () =>
      api.get<UserRanking>(`/api/gamification/rankings/user?type=${selectedType}`),
  });

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-orange-600" />;
      default:
        return <Star className="w-5 h-5 text-gray-400" />;
    }
  };

  const getRankBadgeColor = (position: number) => {
    switch (position) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      case 3:
        return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  const formatPeriod = (type: RankingType) => {
    switch (type) {
      case RankingType.WEEKLY:
        return 'Últimos 7 dias';
      case RankingType.MONTHLY:
        return 'Este mês';
      case RankingType.ALL_TIME:
        return 'Todos os tempos';
      default:
        return '';
    }
  };

  const rankings = rankingsData?.rankings || [];
  const userRanking = userRankingData;

  if (rankingsLoading || userRankingLoading) {
    return (
      <Layout>
        <LoadingSpinner fullScreen text="Carregando rankings..." />
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
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Rankings</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Veja quem está no topo! Compete e alcance as primeiras posições.
          </p>
        </motion.div>

        {/* Type Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex gap-2 flex-wrap">
            {Object.values(RankingType).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  selectedType === type
                    ? 'bg-gradient-purple text-white shadow-glow-purple scale-105'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                {type === RankingType.WEEKLY && 'Semanal'}
                {type === RankingType.MONTHLY && 'Mensal'}
                {type === RankingType.ALL_TIME && 'Todos os Tempos'}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {formatPeriod(selectedType)}
          </p>
        </motion.div>

        {/* User Ranking Card */}
        {userRanking && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <Card variant="gamified" glow="purple">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-purple rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {userRanking.position}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Sua Posição</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {userRanking.position}º lugar
                    </h3>
                    <p className="text-sm text-purple-600 font-semibold">
                      {userRanking.points} pontos
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <TrendingUp className="w-8 h-8 text-purple-600 mb-2" />
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {formatPeriod(selectedType)}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Rankings List */}
        {rankings.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Nenhum ranking disponível
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Comece a completar tarefas e ganhar pontos para aparecer no ranking!
              </p>
            </div>
          </Card>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <div className="space-y-3">
                {/* Top 3 Podium */}
                {rankings.length >= 3 && (
                  <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                    {/* 2nd Place */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="flex flex-col items-center"
                    >
                      <div className="w-16 h-16 bg-gradient-to-r from-gray-300 to-gray-500 rounded-full flex items-center justify-center text-white text-xl font-bold mb-2">
                        2
                      </div>
                      <img
                        src={
                          rankings[1].user.avatar ||
                          `https://ui-avatars.com/api/?name=${rankings[1].user.name}&background=6366f1&color=fff`
                        }
                        alt={rankings[1].user.name}
                        className="w-20 h-20 rounded-full border-4 border-gray-300 mb-2"
                      />
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm text-center">
                        {rankings[1].user.name}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {rankings[1].points} pts
                      </p>
                    </motion.div>

                    {/* 1st Place */}
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="flex flex-col items-center"
                    >
                      <Crown className="w-8 h-8 text-yellow-500 mb-2" />
                      <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-2">
                        1
                      </div>
                      <img
                        src={
                          rankings[0].user.avatar ||
                          `https://ui-avatars.com/api/?name=${rankings[0].user.name}&background=fbbf24&color=fff`
                        }
                        alt={rankings[0].user.name}
                        className="w-24 h-24 rounded-full border-4 border-yellow-400 mb-2 shadow-lg"
                      />
                      <h4 className="font-bold text-gray-900 dark:text-white text-center">
                        {rankings[0].user.name}
                      </h4>
                      <p className="text-sm font-semibold text-yellow-600">
                        {rankings[0].points} pts
                      </p>
                    </motion.div>

                    {/* 3rd Place */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="flex flex-col items-center"
                    >
                      <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white text-xl font-bold mb-2">
                        3
                      </div>
                      <img
                        src={
                          rankings[2].user.avatar ||
                          `https://ui-avatars.com/api/?name=${rankings[2].user.name}&background=f97316&color=fff`
                        }
                        alt={rankings[2].user.name}
                        className="w-20 h-20 rounded-full border-4 border-orange-400 mb-2"
                      />
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm text-center">
                        {rankings[2].user.name}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {rankings[2].points} pts
                      </p>
                    </motion.div>
                  </div>
                )}

                {/* Rest of Rankings */}
                <div className="space-y-2">
                  {rankings.slice(3).map((entry, index) => {
                    const actualIndex = index + 4;
                    const isCurrentUser = entry.user._id === user?.id;

                    return (
                      <motion.div
                        key={entry._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + index * 0.05 }}
                        className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                          isCurrentUser
                            ? 'bg-gradient-purple/10 border-2 border-purple-500 dark:bg-purple-900/20'
                            : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${getRankBadgeColor(actualIndex)}`}>
                          {actualIndex}
                        </div>
                        <img
                          src={
                            entry.user.avatar ||
                            `https://ui-avatars.com/api/?name=${entry.user.name}&background=random&color=fff`
                          }
                          alt={entry.user.name}
                          className="w-12 h-12 rounded-full border-2 border-gray-300 dark:border-gray-600"
                        />
                        <div className="flex-1">
                          <h4 className={`font-semibold ${isCurrentUser ? 'text-purple-700 dark:text-purple-300' : 'text-gray-900 dark:text-white'}`}>
                            {entry.user.name}
                            {isCurrentUser && (
                              <span className="ml-2 text-xs bg-purple-500 text-white px-2 py-1 rounded-full">
                                Você
                              </span>
                            )}
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {entry.user.email}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900 dark:text-white">
                            {entry.points}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">pontos</p>
                        </div>
                        {getRankIcon(actualIndex)}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </Container>
    </Layout>
  );
}

