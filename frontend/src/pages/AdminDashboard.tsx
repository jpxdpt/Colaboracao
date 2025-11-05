import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { taskService } from '../services/taskService';
import { userService } from '../services/userService';
import { TaskWithRelations, User } from '../types';
import KanbanBoard from '../components/KanbanBoard';
import CalendarView from '../components/CalendarView';
import TaskModal from '../components/TaskModal';
import UserManagement from '../components/UserManagement';
import StatsCards from '../components/StatsCards';
import SearchBar from '../components/SearchBar';
import NotificationCenter from '../components/NotificationCenter';
import DarkModeToggle from '../components/DarkModeToggle';
import QuickActions from '../components/QuickActions';
import { Plus, Users, LogOut, LayoutGrid, Calendar as CalendarIcon, Filter } from 'lucide-react';

type ViewMode = 'kanban' | 'calendar';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<TaskWithRelations[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
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

      const [tasksData, usersData, statsData] = await Promise.all([
        taskService.getTasks(params),
        userService.getUsers(),
        userService.getUserStats(),
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
      filtered = filtered.filter((task) => task.assigned_to === filters.assignedTo);
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Painel Administrativo
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Bem-vindo, {user?.name}</p>
            </div>
            <div className="flex items-center gap-4">
              <SearchBar onSearch={handleSearch} />
              <NotificationCenter onTaskClick={handleTaskClick} />
              <DarkModeToggle />
              <button
                onClick={() => setShowUserManagement(true)}
                className="btn btn-secondary flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Utilizadores
              </button>
              <button onClick={logout} className="btn btn-secondary flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <StatsCards stats={stats} />

        {/* View Mode Toggle and Filters */}
        <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex items-center gap-2">
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

          {/* Filtros */}
          <div className="flex items-center gap-2 flex-wrap">
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

            {(filters.status || filters.priority || filters.assignedTo) && (
              <button
                onClick={() => setFilters({ status: '', priority: '', assignedTo: '' })}
                className="btn btn-secondary text-sm"
              >
                Limpar Filtros
              </button>
            )}
          </div>
        </div>

        {/* View Content */}
        {viewMode === 'kanban' ? (
          <KanbanBoard
            tasks={filteredTasks}
            onTaskClick={handleEditTask}
            onTaskUpdate={loadData}
            onTaskDelete={handleDeleteTask}
            isAdmin={true}
            users={users}
          />
        ) : (
          <CalendarView tasks={filteredTasks} onTaskClick={handleEditTask} />
        )}
      </div>

      {/* Quick Actions */}
      <QuickActions onNewTask={handleCreateTask} />

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

      {/* User Management Modal */}
      {showUserManagement && (
        <UserManagement
          onClose={() => setShowUserManagement(false)}
          onUpdate={loadData}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
