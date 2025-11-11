import { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Plus, TrendingUp, Calendar, X } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Container from '../components/layout/Container';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import ProgressBar from '../components/gamification/ProgressBar';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Modal from '../components/ui/Modal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import toast from 'react-hot-toast';

interface Goal {
  _id: string;
  title: string;
  description?: string;
  type: 'individual' | 'team';
  target: number;
  currentProgress: number;
  unit: string;
  dueDate?: string;
  milestones?: Array<{ target: number; reward: string; achieved?: boolean }>;
  createdAt: string;
}

interface Milestone {
  target: number;
  reward: string;
}

export default function Goals() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [goalForm, setGoalForm] = useState({
    title: '',
    description: '',
    type: 'individual' as 'individual' | 'team',
    target: 1,
    unit: 'unidades',
    dueDate: '',
    milestones: [] as Milestone[],
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [newMilestone, setNewMilestone] = useState({ target: 0, reward: '' });
  const queryClient = useQueryClient();

  const { data: goalsData, isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: () => api.get<Goal[]>('/api/goals'),
  });

  const goals = Array.isArray(goalsData) ? goalsData : [];

  const createGoalMutation = useMutation({
    mutationFn: (data: {
      title: string;
      description?: string;
      type: 'individual' | 'team';
      target: number;
      unit: string;
      dueDate?: string;
      milestones?: Array<{ target: number; reward: string }>;
    }) => api.post('/api/goals', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Meta criada com sucesso!');
      setShowCreateModal(false);
      setGoalForm({
        title: '',
        description: '',
        type: 'individual',
        target: 1,
        unit: 'unidades',
        dueDate: '',
        milestones: [],
      });
      setFormErrors({});
      setNewMilestone({ target: 0, reward: '' });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar meta');
    },
  });

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!goalForm.title.trim()) {
      errors.title = 'Título é obrigatório';
    } else if (goalForm.title.length > 200) {
      errors.title = 'Título muito longo (máximo 200 caracteres)';
    }

    if (goalForm.description && goalForm.description.length > 2000) {
      errors.description = 'Descrição muito longa (máximo 2000 caracteres)';
    }

    if (goalForm.target < 1) {
      errors.target = 'Meta deve ser pelo menos 1';
    }

    if (!goalForm.unit.trim()) {
      errors.unit = 'Unidade é obrigatória';
    }

    // Validar milestones
    goalForm.milestones.forEach((milestone, index) => {
      if (milestone.target < 1) {
        errors[`milestone_${index}_target`] = 'Meta do milestone deve ser pelo menos 1';
      }
      if (milestone.target >= goalForm.target) {
        errors[`milestone_${index}_target`] = 'Meta do milestone deve ser menor que a meta total';
      }
      if (!milestone.reward.trim()) {
        errors[`milestone_${index}_reward`] = 'Recompensa é obrigatória';
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    const goalData: any = {
      title: goalForm.title.trim(),
      type: goalForm.type,
      target: goalForm.target,
      unit: goalForm.unit.trim(),
    };

    if (goalForm.description.trim()) {
      goalData.description = goalForm.description.trim();
    }

    if (goalForm.dueDate) {
      const date = new Date(goalForm.dueDate);
      goalData.dueDate = date.toISOString();
    }

    if (goalForm.milestones.length > 0) {
      goalData.milestones = goalForm.milestones;
    }

    createGoalMutation.mutate(goalData);
  };

  const addMilestone = () => {
    if (newMilestone.target > 0 && newMilestone.target < goalForm.target && newMilestone.reward.trim()) {
      setGoalForm({
        ...goalForm,
        milestones: [...goalForm.milestones, { ...newMilestone }],
      });
      setNewMilestone({ target: 0, reward: '' });
    }
  };

  const removeMilestone = (index: number) => {
    setGoalForm({
      ...goalForm,
      milestones: goalForm.milestones.filter((_, i) => i !== index),
    });
  };

  const calculateProgress = (goal: Goal) => {
    return Math.min((goal.currentProgress / goal.target) * 100, 100);
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
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Metas</h1>
            <p className="text-gray-600">Acompanhe seu progresso e alcance seus objetivos!</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Button
              variant="gamified"
              icon={<Plus className="w-5 h-5" />}
              onClick={() => setShowCreateModal(true)}
            >
              Nova Meta
            </Button>
          </motion.div>
        </div>

        {isLoading ? (
          <LoadingSpinner fullScreen text="Carregando metas..." />
        ) : !goals || goals.length === 0 ? (
          <EmptyState
            icon={Target}
            title="Nenhuma meta criada"
            description="Crie sua primeira meta e comece a trabalhar em direção aos seus objetivos!"
            action={
              <Button variant="gamified" onClick={() => setShowCreateModal(true)}>
                Criar Meta
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {goals.map((goal, index) => {
              const progress = calculateProgress(goal);
              return (
                <motion.div
                  key={goal._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card variant="gamified" glow="purple">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-purple rounded-xl flex items-center justify-center">
                          <Target className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{goal.title}</h3>
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded ${
                              goal.type === 'team'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-purple-100 text-purple-700'
                            }`}
                          >
                            {goal.type === 'team' ? 'Equipa' : 'Individual'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {goal.description && (
                      <p className="text-gray-600 mb-4">{goal.description}</p>
                    )}

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progresso</span>
                        <span className="text-sm font-semibold text-purple-600">
                          {goal.currentProgress} / {goal.target} {goal.unit}
                        </span>
                      </div>
                      <ProgressBar progress={progress} color="purple" height="lg" />
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <TrendingUp className="w-4 h-4" />
                        <span>{progress.toFixed(1)}% completo</span>
                      </div>
                      {goal.dueDate && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(goal.dueDate).toLocaleDateString('pt-PT')}</span>
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Create Goal Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setGoalForm({
              title: '',
              description: '',
              type: 'individual',
              target: 1,
              unit: 'unidades',
              dueDate: '',
              milestones: [],
            });
            setFormErrors({});
            setNewMilestone({ target: 0, reward: '' });
          }}
          title="Nova Meta"
          size="lg"
        >
          <form onSubmit={handleCreateGoal} className="space-y-4">
            {/* Título */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Título <span className="text-red-500">*</span>
              </label>
              <Input
                value={goalForm.title}
                onChange={(e) => {
                  setGoalForm({ ...goalForm, title: e.target.value });
                  if (formErrors.title) setFormErrors({ ...formErrors, title: '' });
                }}
                error={formErrors.title}
                placeholder="Ex: Vender 100 produtos este mês"
                required
                maxLength={200}
              />
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descrição
              </label>
              <textarea
                value={goalForm.description}
                onChange={(e) => {
                  setGoalForm({ ...goalForm, description: e.target.value });
                  if (formErrors.description) setFormErrors({ ...formErrors, description: '' });
                }}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
                placeholder="Descreva sua meta em detalhes..."
                maxLength={2000}
              />
              {formErrors.description && (
                <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {goalForm.description.length}/2000 caracteres
              </p>
            </div>

            {/* Tipo e Meta */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo <span className="text-red-500">*</span>
                </label>
                <select
                  value={goalForm.type}
                  onChange={(e) => setGoalForm({ ...goalForm, type: e.target.value as 'individual' | 'team' })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="individual">Individual</option>
                  <option value="team">Equipa</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Meta <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  value={goalForm.target}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    setGoalForm({ ...goalForm, target: value });
                    if (formErrors.target) setFormErrors({ ...formErrors, target: '' });
                  }}
                  error={formErrors.target}
                  placeholder="100"
                  min="1"
                  required
                />
              </div>
            </div>

            {/* Unidade e Data */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Unidade <span className="text-red-500">*</span>
                </label>
                <Input
                  value={goalForm.unit}
                  onChange={(e) => {
                    setGoalForm({ ...goalForm, unit: e.target.value });
                    if (formErrors.unit) setFormErrors({ ...formErrors, unit: '' });
                  }}
                  error={formErrors.unit}
                  placeholder="Ex: produtos, vendas, horas"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data Limite
                </label>
                <Input
                  type="datetime-local"
                  value={goalForm.dueDate}
                  onChange={(e) => setGoalForm({ ...goalForm, dueDate: e.target.value })}
                  className="dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
            </div>

            {/* Milestones */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Marcos (Milestones)
              </label>
              {goalForm.milestones.length > 0 && (
                <div className="space-y-2 mb-3">
                  {goalForm.milestones.map((milestone, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {milestone.target} {goalForm.unit} - {milestone.reward}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMilestone(index)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={newMilestone.target || ''}
                  onChange={(e) =>
                    setNewMilestone({ ...newMilestone, target: parseInt(e.target.value) || 0 })
                  }
                  placeholder="Meta do milestone"
                  min="1"
                  max={goalForm.target - 1}
                  className="flex-1"
                />
                <Input
                  value={newMilestone.reward}
                  onChange={(e) => setNewMilestone({ ...newMilestone, reward: e.target.value })}
                  placeholder="Recompensa"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={addMilestone}
                  disabled={newMilestone.target < 1 || newMilestone.target >= goalForm.target || !newMilestone.reward.trim()}
                >
                  Adicionar
                </Button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Adicione marcos intermediários para acompanhar o progresso
              </p>
            </div>

            {/* Botões */}
            <div className="flex gap-2 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowCreateModal(false);
                  setGoalForm({
                    title: '',
                    description: '',
                    type: 'individual',
                    target: 1,
                    unit: 'unidades',
                    dueDate: '',
                    milestones: [],
                  });
                  setFormErrors({});
                  setNewMilestone({ target: 0, reward: '' });
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="gamified"
                disabled={createGoalMutation.isPending}
                icon={<Plus className="w-5 h-5" />}
              >
                {createGoalMutation.isPending ? 'Criando...' : 'Criar Meta'}
              </Button>
            </div>
          </form>
        </Modal>
      </Container>
    </Layout>
  );
}

