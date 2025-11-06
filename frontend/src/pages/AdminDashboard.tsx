import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { taskService } from '../services/taskService';
import { userService } from '../services/userService';
import { TaskWithRelations, User } from '../types';
import Sidebar from '../components/Sidebar';
import KanbanBoard from '../components/KanbanBoard';
import CalendarView from '../components/CalendarView';
import GanttChart from '../components/GanttChart';
import TaskModal from '../components/TaskModal';
import ReportExport from '../components/ReportExport';
import UserManagement from '../components/UserManagement';
import StatsCards from '../components/StatsCards';
import AdvancedStats from '../components/AdvancedStats';
import SearchBar from '../components/SearchBar';
import NotificationCenter from '../components/NotificationCenter';
import DarkModeToggle from '../components/DarkModeToggle';
import QuickActions from '../components/QuickActions';
import CommandPalette from '../components/CommandPalette';
import { useKeyboardShortcutsWithInputCheck } from '../hooks/useKeyboardShortcuts';
import { Plus, Filter, X } from 'lucide-react';

type ViewMode = 'kanban' | 'calendar' | 'gantt';
type Section = 'dashboard' | 'tasks' | 'users' | 'reports' | 'notifications' | 'settings';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<TaskWithRelations[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
  const [currentSection, setCurrentSection] = useState<Section>('dashboard');
  const [taskViewMode, setTaskViewMode] = useState<ViewMode>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '' as 'pending' | 'in_progress' | 'completed' | '',
    priority: '' as 'low' | 'medium' | 'high' | '',
    assignedTo: '',
  });
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
  });
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
      key: 'n',
      action: () => {
        if (!showTaskModal) {
          handleCreateTask();
        }
      },
      description: 'Nova tarefa',
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
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tasks, searchQuery, filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.assignedTo) params.assigned_to = filters.assignedTo;
      if (searchQuery) params.search = searchQuery;

      const [tasksData, usersData] = await Promise.all([
        taskService.getTasks(params),
        userService.getUsers(),
      ]);

      setTasks(tasksData);
      setUsers(usersData);

      setStats({
        total: tasksData.length,
        pending: tasksData.filter((t) => t.status === 'pending').length,
        in_progress: tasksData.filter((t) => t.status === 'in_progress').length,
        completed: tasksData.filter((t) => t.status === 'completed').length,
      });
    } catch (error) {
      console.error('Error loading data:', error);
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

    if (filters.status) {
      filtered = filtered.filter((task) => task.status === filters.status);
    }

    if (filters.priority) {
      filtered = filtered.filter((task) => task.priority === filters.priority);
    }

    if (filters.assignedTo) {
      filtered = filtered.filter((task) => 
        Array.isArray(task.assigned_to) 
          ? task.assigned_to.includes(filters.assignedTo)
          : task.assigned_to === filters.assignedTo
      );
    }

    setFilteredTasks(filtered);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCreateTask = () => {
    setSelectedTask(null);
    setShowTaskModal(true);
  };

  const handleEditTask = (task: TaskWithRelations) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleTaskSaved = () => {
    setShowTaskModal(false);
    setSelectedTask(null);
    loadData();
  };

  const handleDeleteTask = async (id: string) => {
    if (window.confirm('Tem a certeza que deseja eliminar esta tarefa?')) {
      try {
        await taskService.deleteTask(id);
        loadData();
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const handleTaskClick = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      handleEditTask(task);
    }
  };

  const handleViewChange = (view: string) => {
    console.log('AdminDashboard: handleViewChange called with:', view);
    if (view.startsWith('tasks-')) {
      const taskView = view.split('-')[1] as ViewMode;
      setTaskViewMode(taskView);
      setCurrentSection('tasks');
    } else if (view === 'tasks') {
      // Quando clica em "Tarefas", definir kanban como padrão
      setCurrentSection('tasks');
      setTaskViewMode('kanban');
    } else {
      setCurrentSection(view as Section);
    }
  };

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
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Visão Geral
              </h2>
              <StatsCards stats={stats} />
              <AdvancedStats tasks={tasks} users={users} isAdmin={true} />
            </div>
          </div>
        );

      case 'tasks':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tarefas</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Filtros
                </button>
                <button onClick={handleCreateTask} className="btn btn-primary flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Nova Tarefa
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="card p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Filtros</h3>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <select
                    value={filters.status}
                    onChange={(e) =>
                      setFilters({ ...filters, status: e.target.value as typeof filters.status })
                    }
                    className="input"
                  >
                    <option value="">Todos os estados</option>
                    <option value="pending">Pendentes</option>
                    <option value="in_progress">Em Progresso</option>
                    <option value="completed">Concluídas</option>
                  </select>

                  <select
                    value={filters.priority}
                    onChange={(e) =>
                      setFilters({ ...filters, priority: e.target.value as typeof filters.priority })
                    }
                    className="input"
                  >
                    <option value="">Todas as prioridades</option>
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                  </select>

                  <select
                    value={filters.assignedTo}
                    onChange={(e) => setFilters({ ...filters, assignedTo: e.target.value })}
                    className="input"
                  >
                    <option value="">Todos os utilizadores</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
                {(filters.status || filters.priority || filters.assignedTo) && (
                  <button
                    onClick={() => setFilters({ status: '', priority: '', assignedTo: '' })}
                    className="btn btn-secondary text-sm"
                  >
                    Limpar Filtros
                  </button>
                )}
              </div>
            )}

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
                tasks={filteredTasks}
                onTaskClick={handleEditTask}
                onTaskUpdate={loadData}
                onTaskDelete={handleDeleteTask}
                isAdmin={true}
                users={users}
              />
            ) : taskViewMode === 'calendar' ? (
              <CalendarView tasks={filteredTasks} onTaskClick={handleEditTask} />
            ) : (
              <GanttChart tasks={filteredTasks} onTaskClick={handleEditTask} />
            )}
          </div>
        );

      case 'users':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gestão de Utilizadores</h2>
            <UserManagement onClose={() => {}} onUpdate={loadData} />
          </div>
        );

      case 'reports':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Relatórios</h2>
            <div className="card p-6">
              <ReportExport type="tasks" filters={filters} isAdmin={true} />
              <div className="mt-6">
                <ReportExport type="users" filters={filters} isAdmin={true} />
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Notificações</h2>
            <div className="card p-6">
              <NotificationCenter onTaskClick={handleTaskClick} />
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar
        isAdmin={true}
        onLogout={logout}
        currentView={
          currentSection === 'tasks' ? `tasks-${taskViewMode}` : currentSection
        }
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
                <NotificationCenter onTaskClick={handleTaskClick} />
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

      {/* Quick Actions */}
      {currentSection === 'tasks' && <QuickActions onNewTask={handleCreateTask} />}

      {/* Task Modal */}
      {showTaskModal && (
        <TaskModal
          task={selectedTask}
          users={users}
          onClose={() => {
            setShowTaskModal(false);
            setSelectedTask(null);
          }}
          onSave={handleTaskSaved}
          isAdmin={true}
        />
      )}

      {/* Command Palette */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onNewTask={handleCreateTask}
        onSearch={() => {
          const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
          searchInput?.focus();
        }}
        onCalendar={() => {
          setCurrentSection('tasks');
          setTaskViewMode('calendar');
        }}
        onUsers={() => setCurrentSection('users')}
      />
    </div>
  );
};

export default AdminDashboard;
