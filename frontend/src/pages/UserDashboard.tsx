import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { taskService } from '../services/taskService';
import { TaskWithRelations } from '../types';
import Sidebar from '../components/Sidebar';
import KanbanBoard from '../components/KanbanBoard';
import CalendarView from '../components/CalendarView';
import GanttChart from '../components/GanttChart';
import TaskModal from '../components/TaskModal';
import NotificationCenter from '../components/NotificationCenter';
import DarkModeToggle from '../components/DarkModeToggle';
import SearchBar from '../components/SearchBar';
import CommandPalette from '../components/CommandPalette';
import { useKeyboardShortcutsWithInputCheck } from '../hooks/useKeyboardShortcuts';
import { Plus, List, Clock, Play, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale/pt';

type ViewMode = 'kanban' | 'calendar' | 'gantt';
type Section = 'dashboard' | 'tasks' | 'notifications' | 'settings';

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<TaskWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
  const [currentSection, setCurrentSection] = useState<Section>('dashboard');
  const [taskViewMode, setTaskViewMode] = useState<ViewMode>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  // Atalhos de teclado
  useKeyboardShortcutsWithInputCheck([
    {
      key: 'k',
      ctrl: true,
      action: () => setShowCommandPalette(true),
      description: 'Abrir Command Palette',
    },
    {
      key: 'Escape',
      action: () => {
        if (showTaskModal) {
          setShowTaskModal(false);
          setSelectedTask(null);
        }
        if (showCommandPalette) {
          setShowCommandPalette(false);
        }
      },
      description: 'Fechar modais',
    },
  ]);

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tasks, searchQuery]);

  // Removido - não é necessário

  const loadTasks = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      const tasksData = await taskService.getTasks(params);
      setTasks(tasksData);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...tasks];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query)
      );
    }

    // Filtrar apenas tarefas atribuídas ao utilizador
    filtered = filtered.filter((t) =>
      Array.isArray(t.assigned_to) ? t.assigned_to.includes(user?.id || '') : t.assigned_to === user?.id
    );

    setFilteredTasks(filtered);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleTaskClick = (task: TaskWithRelations) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleCreateTask = () => {
    setSelectedTask(null);
    setShowTaskModal(true);
  };

  const handleTaskUpdate = async () => {
    await loadTasks();
    if (selectedTask) {
      const updatedTask = await taskService.getTask(selectedTask.id);
      setSelectedTask(updatedTask);
    }
  };

  const handleTaskClickFromNotification = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      handleTaskClick(task);
    }
  };

  const myTasks = filteredTasks;
  const pendingTasks = myTasks.filter((t) => t.status === 'pending');
  const inProgressTasks = myTasks.filter((t) => t.status === 'in_progress');
  const completedTasks = myTasks.filter((t) => t.status === 'completed');

  const upcomingDeadlines = myTasks
    .filter((t) => t.deadline && t.status !== 'completed')
    .sort((a, b) => {
      if (!a.deadline || !b.deadline) return 0;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    })
    .slice(0, 5);

  const overdueTasks = myTasks.filter(
    (t) => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed'
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      );
    }

    switch (currentSection) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Visão geral das suas tarefas e estatísticas
                </p>
              </div>
              <button
                onClick={handleCreateTask}
                className="btn btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nova Tarefa
              </button>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="card dark:bg-gray-800 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Total de Tarefas
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {myTasks.length}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    <List className="w-6 h-6" />
                  </div>
                </div>
              </div>
              <div className="card dark:bg-gray-800 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Pendentes
                    </p>
                    <p className="text-3xl font-bold text-yellow-600">{pendingTasks.length}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
                    <Clock className="w-6 h-6" />
                  </div>
                </div>
              </div>
              <div className="card dark:bg-gray-800 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Em Progresso
                    </p>
                    <p className="text-3xl font-bold text-blue-600">{inProgressTasks.length}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                    <Play className="w-6 h-6" />
                  </div>
                </div>
              </div>
              <div className="card dark:bg-gray-800 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Concluídas
                    </p>
                    <p className="text-3xl font-bold text-green-600">{completedTasks.length}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Alertas de Atrasos */}
              {overdueTasks.length > 0 && (
                <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                  <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-3">
                    Tarefas Atrasadas
                  </h3>
                  <div className="space-y-2">
                    {overdueTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => handleTaskClick(task)}
                        className="p-2 bg-white dark:bg-gray-800 rounded cursor-pointer hover:shadow transition-shadow"
                      >
                        <div className="font-medium text-sm text-gray-900 dark:text-white">
                          {task.title}
                        </div>
                        <div className="text-xs text-red-600 dark:text-red-400">
                          Vencida em {task.deadline && format(new Date(task.deadline), 'd MMM', { locale: pt })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Prazos Próximos */}
              <div className="card dark:bg-gray-800 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Prazos Próximos
                </h3>
                {upcomingDeadlines.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Sem prazos próximos</p>
                ) : (
                  <div className="space-y-3">
                    {upcomingDeadlines.map((task) => (
                      <div
                        key={task.id}
                        className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        onClick={() => handleTaskClick(task)}
                      >
                        <div className="font-medium text-sm text-gray-900 dark:text-white mb-1">
                          {task.title}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {task.deadline &&
                            format(new Date(task.deadline), "d 'de' MMMM, yyyy", { locale: pt })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Resumo */}
            <div className="card dark:bg-gray-800 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Resumo</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total de Tarefas</span>
                  <span className="font-medium text-gray-900 dark:text-white">{myTasks.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Taxa de Conclusão</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {myTasks.length > 0
                      ? Math.round((completedTasks.length / myTasks.length) * 100)
                      : 0}
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'tasks':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Minhas Tarefas</h2>

            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setTaskViewMode('kanban')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  taskViewMode === 'kanban'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Kanban
              </button>
              <button
                onClick={() => setTaskViewMode('calendar')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  taskViewMode === 'calendar'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Calendário
              </button>
              <button
                onClick={() => setTaskViewMode('gantt')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  taskViewMode === 'gantt'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Gantt
              </button>
            </div>

            {taskViewMode === 'kanban' ? (
              <KanbanBoard
                tasks={myTasks}
                onTaskClick={handleTaskClick}
                onTaskUpdate={handleTaskUpdate}
                isAdmin={false}
              />
            ) : taskViewMode === 'calendar' ? (
              <CalendarView tasks={myTasks} onTaskClick={handleTaskClick} />
            ) : (
              <GanttChart tasks={myTasks} onTaskClick={handleTaskClick} />
            )}
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Notificações</h2>
            <div className="card p-6">
              <NotificationCenter onTaskClick={handleTaskClickFromNotification} />
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Configurações</h2>
            <div className="card p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Tema</h3>
                <DarkModeToggle />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Função para mudar de secção
  const handleViewChange = (view: string) => {
    console.log('UserDashboard: handleViewChange called with:', view);
    if (view.startsWith('tasks-')) {
      const taskView = view.split('-')[1] as ViewMode;
      setTaskViewMode(taskView);
      setCurrentSection('tasks');
    } else if (view === 'tasks') {
      setCurrentSection('tasks');
      setTaskViewMode('kanban');
    } else {
      setCurrentSection(view as Section);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar
        isAdmin={false}
        onLogout={logout}
        currentView={currentSection === 'tasks' ? `tasks-${taskViewMode}` : currentSection}
        onViewChange={handleViewChange}
      />

      {/* Main Content */}
      <div className="ml-0 lg:ml-64 min-h-screen">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Bem-vindo, <span className="font-medium">{user?.name}</span>
                </p>
              </div>
              <div className="flex items-center gap-4">
                <SearchBar onSearch={handleSearch} />
                <NotificationCenter onTaskClick={handleTaskClickFromNotification} />
                <DarkModeToggle />
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {renderContent()}
        </main>
      </div>

      {/* Task Modal */}
      {showTaskModal && selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => {
            setShowTaskModal(false);
            setSelectedTask(null);
          }}
          onSave={handleTaskUpdate}
          isAdmin={false}
        />
      )}

      {/* Command Palette */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onSearch={() => {
          const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
          searchInput?.focus();
        }}
        onCalendar={() => {
          setCurrentSection('tasks');
          setTaskViewMode('calendar');
        }}
      />
    </div>
  );
};

export default UserDashboard;
