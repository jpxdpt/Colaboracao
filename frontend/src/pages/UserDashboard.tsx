import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { taskService } from '../services/taskService';
import { TaskWithRelations } from '../types';
import KanbanBoard from '../components/KanbanBoard';
import CalendarView from '../components/CalendarView';
import TaskModal from '../components/TaskModal';
import NotificationCenter from '../components/NotificationCenter';
import DarkModeToggle from '../components/DarkModeToggle';
import SearchBar from '../components/SearchBar';
import { LogOut, LayoutGrid, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale/pt';

type ViewMode = 'kanban' | 'calendar';

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<TaskWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tasks, searchQuery]);

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

    setFilteredTasks(filtered);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleTaskClick = (task: TaskWithRelations) => {
    setSelectedTask(task);
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

  const myTasks = filteredTasks.filter((t) => 
    Array.isArray(t.assigned_to) 
      ? t.assigned_to.includes(user?.id || '')
      : t.assigned_to === user?.id
  );
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Minhas Tarefas</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Bem-vindo, {user?.name}</p>
            </div>
            <div className="flex items-center gap-4">
              <SearchBar onSearch={handleSearch} />
              <NotificationCenter onTaskClick={handleTaskClickFromNotification} />
              <DarkModeToggle />
              <button
                onClick={logout}
                className="btn btn-secondary flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card dark:bg-gray-800 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pendentes</div>
            <div className="text-3xl font-bold text-yellow-600">{pendingTasks.length}</div>
          </div>
          <div className="card dark:bg-gray-800 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Em Progresso</div>
            <div className="text-3xl font-bold text-blue-600">{inProgressTasks.length}</div>
          </div>
          <div className="card dark:bg-gray-800 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Concluídas</div>
            <div className="text-3xl font-bold text-green-600">{completedTasks.length}</div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="mb-6 flex items-center gap-2">
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              viewMode === 'kanban'
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Kanban
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              viewMode === 'calendar'
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            Calendário
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {viewMode === 'kanban' ? (
              <KanbanBoard
                tasks={myTasks}
                onTaskClick={handleTaskClick}
                onTaskUpdate={handleTaskUpdate}
                isAdmin={false}
              />
            ) : (
              <CalendarView tasks={myTasks} onTaskClick={handleTaskClick} />
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
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

            {/* Resumo */}
            <div className="card dark:bg-gray-800 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Resumo</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total de Tarefas</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {myTasks.length}
                  </span>
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
        </div>
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
    </div>
  );
};

export default UserDashboard;
