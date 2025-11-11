import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, CheckCircle2, Circle, Clock, Flag, LayoutGrid, Calendar, BarChart3, ChevronDown, ChevronRight, Edit, Trash2 } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Container from '../components/layout/Container';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { TaskStatus } from '@gamify/shared';
import Confetti from '../components/feedback/Confetti';
import KanbanView from '../components/tasks/KanbanView';
import GanttView from '../components/tasks/GanttView';
import CalendarView from '../components/tasks/CalendarView';
import { useAuthStore } from '../stores/authStore';

type TaskUser = {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
};

interface Task {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  assignedTo?: TaskUser | string;
  createdBy?: TaskUser;
  supervisor?: TaskUser;
  parentTask?: {
    _id: string;
    title: string;
    status: TaskStatus;
  } | string;
  points?: number;
  subtasks?: Task[];
  requiresValidation?: boolean;
  createdAt: string;
}

type ViewMode = 'grid' | 'kanban' | 'gantt' | 'calendar';

const createEmptyTaskForm = () => ({
  title: '',
  description: '',
  priority: 'medium' as 'low' | 'medium' | 'high',
  dueDate: '',
  points: 0,
  requiresValidation: false,
  parentTask: '',
  assignedTo: '',
});

const formatDateForInput = (dateString: string) => {
  const date = new Date(dateString);
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};

export default function Tasks() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const queryClient = useQueryClient();

  const [taskForm, setTaskForm] = useState(createEmptyTaskForm());
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [selectedParentTask, setSelectedParentTask] = useState<Task | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const currentUserId = user?.id || null;
  
  // Debug: verificar se é admin
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Tasks - Verificação de Admin:', {
      user: user?.email,
      role: user?.role,
      isAdmin,
    });
  }
  
  // Buscar lista de usuários apenas se for admin
  const { data: usersData, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get<{ success: boolean; data: Array<{ _id: string; name: string; email: string; avatar?: string }> }>('/api/auth/users'),
    enabled: isAdmin,
    retry: false,
  });
  
  // Debug: verificar dados de usuários
  if (process.env.NODE_ENV === 'development' && isAdmin) {
    console.log('👥 Tasks - Usuários:', {
      usersLoading,
      usersError,
      usersCount: usersData?.data?.length || 0,
      users: usersData?.data,
    });
  }
  
  const users = usersData?.data || [];

  const resetTaskForm = () => {
    setTaskForm(createEmptyTaskForm());
    setFormErrors({});
    setSelectedParentTask(null);
    setEditingTask(null);
  };

  const getTaskUserId = (userRef?: TaskUser | string) => {
    if (!userRef) return undefined;
    if (typeof userRef === 'string') return userRef;
    return userRef._id;
  };

  const canManageTask = (task: Task) => {
    if (isAdmin) return true;
    const createdById = getTaskUserId(task.createdBy);
    const assignedToId = getTaskUserId(task.assignedTo);
    return createdById === currentUserId || assignedToId === currentUserId;
  };

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['tasks', filterStatus],
    queryFn: async () => {
      const response = await api.get<{ tasks: Task[] }>(
        `/api/tasks${filterStatus !== 'all' ? `?status=${filterStatus}` : ''}`
      );
      
      // Buscar subtarefas para cada tarefa principal
      if (response.tasks) {
        const tasksWithSubtasks = await Promise.all(
          response.tasks.map(async (task) => {
            try {
              const subtasksResponse = await api.get<{ subtasks: Task[] }>(
                `/api/tasks/${task._id}/subtasks`
              );
              return { ...task, subtasks: subtasksResponse.subtasks || [] };
            } catch {
              return { ...task, subtasks: [] };
            }
          })
        );
        return { tasks: tasksWithSubtasks };
      }
      return response;
    },
  });

  const tasks = tasksData?.tasks || [];

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) =>
      api.put(`/api/tasks/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Tarefa atualizada!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar tarefa');
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Tarefa removida!');
      if (showCreateModal) {
        setShowCreateModal(false);
      }
      resetTaskForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao remover tarefa');
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: (data: {
      title: string;
      description?: string;
      priority: 'low' | 'medium' | 'high';
      dueDate?: string;
      points?: number;
      requiresValidation?: boolean;
      parentTask?: string;
      assignedTo?: string;
    }) => api.post('/api/tasks', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(selectedParentTask ? 'Subtarefa criada com sucesso!' : 'Tarefa criada com sucesso!');
      setShowCreateModal(false);
      resetTaskForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar tarefa');
    },
  });

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!taskForm.title.trim()) {
      errors.title = 'Título é obrigatório';
    } else if (taskForm.title.length > 200) {
      errors.title = 'Título muito longo (máximo 200 caracteres)';
    }

    if (taskForm.description && taskForm.description.length > 2000) {
      errors.description = 'Descrição muito longa (máximo 2000 caracteres)';
    }

    if (taskForm.points < 0) {
      errors.points = 'Pontos não podem ser negativos';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    const taskData: Record<string, unknown> = {
      title: taskForm.title.trim(),
      priority: taskForm.priority,
      points: taskForm.points || 0,
      requiresValidation: taskForm.requiresValidation,
    };

    if (taskForm.description.trim()) {
      taskData.description = taskForm.description.trim();
    }

    if (taskForm.dueDate) {
      const date = new Date(taskForm.dueDate);
      taskData.dueDate = date.toISOString();
    }

    if (taskForm.parentTask) {
      taskData.parentTask = taskForm.parentTask;
    }

    const assignedToId = isAdmin
      ? taskForm.assignedTo || currentUserId || undefined
      : currentUserId || undefined;

    if (assignedToId) {
      taskData.assignedTo = assignedToId;
    }

    try {
      if (editingTask) {
        await updateTaskMutation.mutateAsync({
          id: editingTask._id,
          data: taskData,
        });
        setShowCreateModal(false);
        resetTaskForm();
      } else {
        createTaskMutation.mutate(taskData);
      }
    } catch (error) {
      console.error('Erro ao guardar tarefa:', error);
    }
  };

  const handleCreateSubtask = (parentTask: Task) => {
    const parentAssignedId = getTaskUserId(parentTask.assignedTo);
    setSelectedParentTask(parentTask);
    setTaskForm({
      title: '',
      description: '',
      priority: 'medium',
      dueDate: '',
      points: 0,
      requiresValidation: false,
      parentTask: parentTask._id,
      assignedTo: isAdmin ? parentAssignedId || '' : '',
    });
    setEditingTask(null);
    setFormErrors({});
    setShowCreateModal(true);
  };

  const handleEditTask = (task: Task) => {
    if (!canManageTask(task)) {
      toast.error('Você não tem permissão para editar esta tarefa.');
      return;
    }

    setEditingTask(task);
    setSelectedParentTask(null);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      dueDate: task.dueDate ? formatDateForInput(task.dueDate) : '',
      points: task.points || 0,
      requiresValidation: task.requiresValidation ?? false,
      parentTask:
        typeof task.parentTask === 'string'
          ? task.parentTask
          : task.parentTask
          ? task.parentTask._id
          : '',
      assignedTo: isAdmin ? getTaskUserId(task.assignedTo) || '' : '',
    });
    setFormErrors({});
    setShowCreateModal(true);
  };

  const handleDeleteTask = (task: Task) => {
    if (deleteTaskMutation.isPending) {
      return;
    }

    if (!canManageTask(task)) {
      toast.error('Você não tem permissão para remover esta tarefa.');
      return;
    }

    const confirmationMessage = task.subtasks && task.subtasks.length > 0
      ? 'Esta tarefa tem subtarefas associadas. Tem certeza que deseja removê-la?'
      : 'Tem certeza que deseja remover esta tarefa?';

    if (!window.confirm(confirmationMessage)) {
      return;
    }

    deleteTaskMutation.mutate(task._id);
  };

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleCompleteTask = async (task: Task) => {
    if (!canManageTask(task)) {
      toast.error('Você não tem permissão para atualizar esta tarefa.');
      return;
    }

    if (task.status === TaskStatus.COMPLETED) return;

    await updateTaskMutation.mutateAsync({
      id: task._id,
      data: { status: TaskStatus.COMPLETED },
    });

    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  // Filtrar apenas tarefas principais (sem parentTask) e aplicar busca
  const filteredTasks =
    tasks?.filter((task) => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase());
      // Mostrar apenas tarefas principais (sem parentTask)
      return !task.parentTask && matchesSearch;
    }) || [];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-300';
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case TaskStatus.IN_PROGRESS:
        return <Clock className="w-5 h-5 text-blue-600" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const isSaving = editingTask ? updateTaskMutation.isPending : createTaskMutation.isPending;
  const submitButtonLabel = editingTask
    ? isSaving
      ? 'Guardando...'
      : 'Guardar alterações'
    : isSaving
    ? 'Criando...'
    : 'Criar Tarefa';
  const submitButtonIcon = editingTask ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />;

  return (
    <Layout>
      <Confetti trigger={showConfetti} type="success" />
      <Container>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Tarefas</h1>
            <p className="text-gray-600">Gerencie suas tarefas e ganhe pontos!</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Button
              variant="gamified"
              icon={<Plus className="w-5 h-5" />}
              onClick={() => {
                resetTaskForm();
                setShowCreateModal(true);
              }}
            >
              Nova Tarefa
            </Button>
          </motion.div>
        </div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 flex flex-col md:flex-row gap-4"
        >
          <div className="flex-1">
            <Input
              placeholder="Buscar tarefas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-5 h-5" />}
            />
          </div>
          <div className="flex gap-2">
            {['all', 'pending', 'in-progress', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  filterStatus === status
                    ? 'bg-gradient-purple text-white shadow-glow-purple'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {status === 'all'
                  ? 'Todas'
                  : status === 'in-progress'
                  ? 'Em Progresso'
                  : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          {/* View Mode Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Visualização:</span>
            <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-gray-700 text-purple-600 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
                title="Grade"
              >
                <LayoutGrid className="w-4 h-4" />
                Grade
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                  viewMode === 'kanban'
                    ? 'bg-white dark:bg-gray-700 text-purple-600 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
                title="Kanban"
              >
                <BarChart3 className="w-4 h-4" />
                Kanban
              </button>
              <button
                onClick={() => setViewMode('gantt')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                  viewMode === 'gantt'
                    ? 'bg-white dark:bg-gray-700 text-purple-600 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
                title="Gantt"
              >
                <BarChart3 className="w-4 h-4" />
                Gantt
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                  viewMode === 'calendar'
                    ? 'bg-white dark:bg-gray-700 text-purple-600 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
                title="Calendário"
              >
                <Calendar className="w-4 h-4" />
                Calendário
              </button>
            </div>
          </div>
        </motion.div>

        {/* Tasks View */}
        {isLoading ? (
          <LoadingSpinner fullScreen text="Carregando tarefas..." />
        ) : filteredTasks.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="Nenhuma tarefa encontrada"
            description={
              searchQuery
                ? 'Tente ajustar seus filtros de busca'
                : 'Comece criando sua primeira tarefa!'
            }
            action={
              <Button variant="gamified" onClick={() => setShowCreateModal(true)}>
                Criar Tarefa
              </Button>
            }
          />
        ) : (
          <>
            {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.map((task, index) => (
              <motion.div
                key={task._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card variant="interactive" glow="purple">
                  <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2 flex-1">
                          {task.subtasks && task.subtasks.length > 0 && (
                            <button
                              onClick={() => toggleTaskExpansion(task._id)}
                              className="hover:scale-110 transition-transform"
                            >
                              {expandedTasks.has(task._id) ? (
                                <ChevronDown className="w-4 h-4 text-gray-600" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-600" />
                              )}
                            </button>
                          )}
                      <button
                        onClick={() => handleCompleteTask(task)}
                        className="hover:scale-110 transition-transform"
                      >
                        {getStatusIcon(task.status)}
                      </button>
                      <h3
                        className={`font-semibold text-lg ${
                          task.status === TaskStatus.COMPLETED
                            ? 'line-through text-gray-500'
                                : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {task.title}
                      </h3>
                    </div>
                        <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded-lg text-xs font-semibold border ${getPriorityColor(
                        task.priority
                      )}`}
                    >
                      {task.priority === 'high' ? (
                        <Flag className="w-3 h-3 inline" />
                      ) : (
                        task.priority
                      )}
                    </span>
                          {canManageTask(task) && (
                            <>
                              <button
                                onClick={() => handleEditTask(task)}
                                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors"
                                title="Editar tarefa"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteTask(task)}
                                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                title="Excluir tarefa"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                  </div>

                  {task.description && (
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                      {task.description}
                    </p>
                  )}

                      {/* Subtarefas */}
                      {task.subtasks && task.subtasks.length > 0 && expandedTasks.has(task._id) && (
                        <div className="mb-4 pl-4 border-l-2 border-purple-300 dark:border-purple-600 space-y-2">
                          {task.subtasks.map((subtask) => (
                            <div
                              key={subtask._id}
                              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2 flex-1">
                                <button
                                  onClick={() => handleCompleteTask(subtask)}
                                  className="hover:scale-110 transition-transform"
                                >
                                  {getStatusIcon(subtask.status)}
                                </button>
                                <span
                                  className={`text-sm ${
                                    subtask.status === TaskStatus.COMPLETED
                                      ? 'line-through text-gray-500'
                                      : 'text-gray-700 dark:text-gray-300'
                                  }`}
                                >
                                  {subtask.title}
                                </span>
                              </div>
                              {subtask.points && (
                                <span className="text-xs text-purple-600 font-semibold">
                                  +{subtask.points}pts
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                  <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                    {task.points && (
                      <div className="flex items-center gap-1 text-purple-600 font-semibold">
                        <span>+{task.points}</span>
                        <span className="text-xs">pts</span>
                      </div>
                    )}
                          {task.subtasks && task.subtasks.length > 0 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {task.subtasks.filter((st) => st.status === TaskStatus.COMPLETED).length}/
                              {task.subtasks.length} subtarefas
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {canManageTask(task) && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleCreateSubtask(task)}
                              icon={<Plus className="w-3 h-3" />}
                            >
                              Subtarefa
                            </Button>
                          )}
                    {task.dueDate && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(task.dueDate).toLocaleDateString('pt-PT')}
                      </span>
                    )}
                        </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
            )}

            {viewMode === 'kanban' && (
              <KanbanView
                tasks={tasks.filter((task) => {
                  // Incluir apenas tarefas principais que correspondem à busca
                  const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    task.description?.toLowerCase().includes(searchQuery.toLowerCase());
                  return !task.parentTask && matchesSearch;
                })}
                onTaskClick={(task) => {
                  // Pode abrir um modal de detalhes ou navegar
                  console.log('Task clicked:', task);
                }}
                onStatusChange={async (taskId, newStatus) => {
                  try {
                    await updateTaskMutation.mutateAsync({
                      id: taskId,
                      data: { status: newStatus },
                    });
                  } catch (error) {
                    console.error('Error updating task status:', error);
                  }
                }}
              />
            )}

            {viewMode === 'gantt' && (
              <GanttView
                tasks={tasks.filter((task) => {
                  // Incluir apenas tarefas principais que correspondem à busca
                  const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    task.description?.toLowerCase().includes(searchQuery.toLowerCase());
                  return !task.parentTask && matchesSearch;
                })}
                onTaskClick={(task) => {
                  console.log('Task clicked:', task);
                }}
              />
            )}

            {viewMode === 'calendar' && (
              <CalendarView
                tasks={filteredTasks}
                onTaskClick={(task) => {
                  console.log('Task clicked:', task);
                }}
              />
            )}
          </>
        )}

        {/* Create Task Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            resetTaskForm();
          }}
          title={
            editingTask
              ? `Editar Tarefa`
              : selectedParentTask
              ? `Nova Subtarefa de "${selectedParentTask.title}"`
              : 'Nova Tarefa'
          }
          size="md"
        >
          <form onSubmit={handleSaveTask} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Título <span className="text-red-500">*</span>
              </label>
              <Input
                value={taskForm.title}
                onChange={(e) => {
                  setTaskForm({ ...taskForm, title: e.target.value });
                  if (formErrors.title) {
                    setFormErrors({ ...formErrors, title: '' });
                  }
                }}
                error={formErrors.title}
                placeholder="Ex: Implementar nova funcionalidade"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descrição
              </label>
              <textarea
                value={taskForm.description}
                onChange={(e) => {
                  setTaskForm({ ...taskForm, description: e.target.value });
                  if (formErrors.description) {
                    setFormErrors({ ...formErrors, description: '' });
                  }
                }}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
                placeholder="Descreva os detalhes da tarefa..."
                maxLength={2000}
              />
              {formErrors.description && (
                <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {taskForm.description.length}/2000 caracteres
              </p>
            </div>

            {isAdmin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Atribuir a
                </label>
                <select
                  value={taskForm.assignedTo}
                  onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
                  disabled={usersLoading}
                >
                  <option value="">Eu mesmo</option>
                  {usersLoading ? (
                    <option value="" disabled>Carregando usuários...</option>
                  ) : usersError ? (
                    <option value="" disabled>Erro ao carregar usuários</option>
                  ) : users.length === 0 ? (
                    <option value="" disabled>Nenhum usuário disponível</option>
                  ) : (
                    users.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name} ({u.email})
                      </option>
                    ))
                  )}
                </select>
                {usersError && (
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                    Erro ao carregar usuários. A tarefa será atribuída a você.
                  </p>
                )}
                {!usersError && !usersLoading && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Se não selecionar ninguém, a tarefa será atribuída a você
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Prioridade
                </label>
                <select
                  value={taskForm.priority}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, priority: e.target.value as 'low' | 'medium' | 'high' })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pontos
                </label>
                <Input
                  type="number"
                  value={taskForm.points}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setTaskForm({ ...taskForm, points: value });
                    if (formErrors.points) {
                      setFormErrors({ ...formErrors, points: '' });
                    }
                  }}
                  error={formErrors.points}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data de Vencimento
              </label>
              <Input
                type="datetime-local"
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                className="dark:bg-gray-800 dark:text-gray-100"
              />
            </div>

            {!selectedParentTask && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tarefa Pai (opcional)
                </label>
                <select
                  value={taskForm.parentTask}
                  onChange={(e) => setTaskForm({ ...taskForm, parentTask: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="">Nenhuma (tarefa principal)</option>
                  {tasks
                    .filter((t) => !t.parentTask)
                    .map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.title}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {selectedParentTask && (
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  <strong>Subtarefa de:</strong> {selectedParentTask.title}
                </p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="requiresValidation"
                checked={taskForm.requiresValidation}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, requiresValidation: e.target.checked })
                }
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <label
                htmlFor="requiresValidation"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Requer validação
              </label>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowCreateModal(false);
                  resetTaskForm();
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="gamified"
                disabled={isSaving}
                icon={submitButtonIcon}
              >
                {submitButtonLabel}
              </Button>
            </div>
          </form>
        </Modal>
      </Container>
    </Layout>
  );
}

