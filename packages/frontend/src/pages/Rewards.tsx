import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Gift,
  Coins,
  ShoppingBag,
  History,
  CheckCircle2,
  Clock,
  XCircle,
  Filter,
  Search,
  Star,
  Award,
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import Container from '../components/layout/Container';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import CurrencyDisplay from '../components/gamification/CurrencyDisplay';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

interface Reward {
  _id: string;
  name: string;
  description: string;
  type: 'virtual' | 'real';
  cost: number;
  category: string;
  image?: string;
  stock?: number;
  active: boolean;
}

interface Redemption {
  _id: string;
  reward: Reward;
  quantity: number;
  status: 'pending' | 'fulfilled' | 'cancelled';
  redeemedAt: string;
  fulfilledAt?: string;
  createdAt: string;
}

export default function Rewards() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  const { data: currencyData } = useQuery({
    queryKey: ['currency'],
    queryFn: () => api.get<{ balance: number }>('/api/gamification/currency'),
  });

  const { data: rewards, isLoading: rewardsLoading } = useQuery({
    queryKey: ['rewards', selectedCategory, selectedType],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      if (selectedType !== 'all') {
        params.append('type', selectedType);
      }
      return api.get<Reward[]>(
        `/api/gamification/rewards${params.toString() ? `?${params.toString()}` : ''}`
      );
    },
  });

  const { data: redemptions } = useQuery({
    queryKey: ['reward-redemptions'],
    queryFn: () => api.get<Redemption[]>('/api/gamification/rewards/redemptions'),
  });

  const redeemMutation = useMutation({
    mutationFn: (data: { rewardId: string; quantity: number }) =>
      api.post(`/api/gamification/rewards/${data.rewardId}/redeem`, { quantity: data.quantity }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
      queryClient.invalidateQueries({ queryKey: ['reward-redemptions'] });
      queryClient.invalidateQueries({ queryKey: ['currency'] });
      toast.success('Recompensa resgatada com sucesso!');
      setShowRedeemModal(false);
      setSelectedReward(null);
      setQuantity(1);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao resgatar recompensa');
    },
  });

  const handleRedeem = (reward: Reward) => {
    setSelectedReward(reward);
    setQuantity(1);
    setShowRedeemModal(true);
  };

  const confirmRedeem = () => {
    if (!selectedReward) return;
    const totalCost = selectedReward.cost * quantity;
    const balance = currencyData?.balance || 0;

    if (balance < totalCost) {
      toast.error(`Saldo insuficiente! Você tem ${balance} moedas, mas precisa de ${totalCost}.`);
      return;
    }

    if (selectedReward.stock !== undefined && selectedReward.stock < quantity) {
      toast.error('Stock insuficiente');
      return;
    }

    redeemMutation.mutate({ rewardId: selectedReward._id, quantity });
  };

  const categories = Array.from(new Set(rewards?.map((r) => r.category) || []));
  const filteredRewards =
    rewards?.filter(
      (reward) =>
        reward.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reward.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fulfilled':
        return 'text-green-600 bg-green-100 border-green-300';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100 border-yellow-300';
      case 'cancelled':
        return 'text-red-600 bg-red-100 border-red-300';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'fulfilled':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  if (rewardsLoading) {
    return (
      <Layout>
        <LoadingSpinner fullScreen text="Carregando recompensas..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <Container>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Recompensas</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Resgate suas moedas virtuais por recompensas incríveis!
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="flex gap-2"
          >
            <Button
              variant="secondary"
              icon={<History className="w-5 h-5" />}
              onClick={() => setShowHistoryModal(true)}
            >
              Histórico
            </Button>
          </motion.div>
        </div>

        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card variant="gamified" glow="purple">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Seu Saldo de Moedas
                </p>
                {currencyData ? (
                  <CurrencyDisplay balance={currencyData.balance} size="lg" />
                ) : (
                  <div className="text-3xl font-bold text-gradient-purple">0</div>
                )}
              </div>
              <Coins className="w-16 h-16 text-purple-600" />
            </div>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6 space-y-4"
        >
          {/* Search */}
          <div>
            <Input
              placeholder="Buscar recompensas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-5 h-5" />}
            />
          </div>

          {/* Category and Type Filters */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                selectedCategory === 'all'
                  ? 'bg-gradient-purple text-white shadow-glow-purple'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              Todas Categorias
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                  selectedCategory === category
                    ? 'bg-gradient-purple text-white shadow-glow-purple'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            {['all', 'virtual', 'real'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                  selectedType === type
                    ? 'bg-gradient-purple text-white shadow-glow-purple'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                {type === 'all' && 'Todos Tipos'}
                {type === 'virtual' && 'Virtuais'}
                {type === 'real' && 'Reais'}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Rewards Grid */}
        {filteredRewards.length === 0 ? (
          <EmptyState
            icon={Gift}
            title="Nenhuma recompensa disponível"
            description="Novas recompensas serão adicionadas em breve!"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRewards.map((reward, index) => {
              const canAfford = (currencyData?.balance || 0) >= reward.cost;
              const inStock = reward.stock === undefined || reward.stock > 0;

              return (
                <motion.div
                  key={reward._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                >
                  <Card variant="interactive" glow={canAfford && inStock ? 'purple' : undefined}>
                    {reward.image && (
                      <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4 overflow-hidden">
                        <img
                          src={reward.image}
                          alt={reward.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                          {reward.name}
                        </h3>
                        <span
                          className={`inline-block px-2 py-1 rounded-lg text-xs font-semibold ${
                            reward.type === 'virtual'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                              : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          }`}
                        >
                          {reward.type === 'virtual' ? 'Virtual' : 'Real'}
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                      {reward.description}
                    </p>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Coins className="w-5 h-5 text-yellow-600" />
                        <span className="text-xl font-bold text-gray-900 dark:text-white">
                          {reward.cost}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">moedas</span>
                      </div>
                      {reward.stock !== undefined && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {reward.stock} em stock
                        </span>
                      )}
                    </div>

                    <Button
                      variant={canAfford && inStock ? 'gamified' : 'secondary'}
                      className="w-full"
                      onClick={() => handleRedeem(reward)}
                      disabled={!canAfford || !inStock || !reward.active}
                      icon={<ShoppingBag className="w-5 h-5" />}
                    >
                      {!canAfford
                        ? 'Saldo Insuficiente'
                        : !inStock
                        ? 'Sem Stock'
                        : !reward.active
                        ? 'Indisponível'
                        : 'Resgatar'}
                    </Button>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Redeem Modal */}
        <Modal
          isOpen={showRedeemModal}
          onClose={() => {
            setShowRedeemModal(false);
            setSelectedReward(null);
            setQuantity(1);
          }}
          title="Resgatar Recompensa"
          size="md"
        >
          {selectedReward && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {selectedReward.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{selectedReward.description}</p>
              </div>

              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Quantidade</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      -
                    </button>
                    <span className="w-12 text-center font-semibold">{quantity}</span>
                    <button
                      onClick={() =>
                        setQuantity(
                          Math.min(
                            quantity + 1,
                            selectedReward.stock !== undefined ? selectedReward.stock : 10
                          )
                        )
                      }
                      className="w-8 h-8 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-purple-200 dark:border-purple-800">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Custo Total
                  </span>
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-yellow-600" />
                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedReward.cost * quantity}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">moedas</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-purple-200 dark:border-purple-800">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Seu Saldo</span>
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-purple-600" />
                    <span className="font-semibold text-purple-600">
                      {currencyData?.balance || 0}
                    </span>
                  </div>
                </div>
                {(currencyData?.balance || 0) < selectedReward.cost * quantity && (
                  <p className="text-red-500 text-xs mt-2">
                    Saldo insuficiente! Você precisa de mais{' '}
                    {selectedReward.cost * quantity - (currencyData?.balance || 0)} moedas.
                  </p>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowRedeemModal(false);
                    setSelectedReward(null);
                    setQuantity(1);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="gamified"
                  onClick={confirmRedeem}
                  disabled={
                    redeemMutation.isPending ||
                    (currencyData?.balance || 0) < selectedReward.cost * quantity ||
                    (selectedReward.stock !== undefined && selectedReward.stock < quantity)
                  }
                  icon={<ShoppingBag className="w-5 h-5" />}
                >
                  {redeemMutation.isPending ? 'Resgatando...' : 'Confirmar Resgate'}
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* History Modal */}
        <Modal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          title="Histórico de Resgates"
          size="lg"
        >
          {!redemptions || redemptions.length === 0 ? (
            <EmptyState
              icon={History}
              title="Nenhum resgate ainda"
              description="Você ainda não resgatou nenhuma recompensa."
            />
          ) : (
            <div className="space-y-3">
              {redemptions.map((redemption) => (
                <div
                  key={redemption._id}
                  className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {redemption.reward.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Quantidade: {redemption.quantity}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Resgatado em{' '}
                        {new Date(redemption.redeemedAt).toLocaleDateString('pt-PT', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1 ${getStatusColor(
                        redemption.status
                      )}`}
                    >
                      {getStatusIcon(redemption.status)}
                      {redemption.status === 'fulfilled' && 'Entregue'}
                      {redemption.status === 'pending' && 'Pendente'}
                      {redemption.status === 'cancelled' && 'Cancelado'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      </Container>
    </Layout>
  );
}

