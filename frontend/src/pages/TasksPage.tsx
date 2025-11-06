import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { taskService } from '../services/taskService';
import { userService } from '../services/userService';
import { TaskWithRelations, User } from '../types';
import KanbanBoard from '../components/KanbanBoard';
import CalendarView from '../components/CalendarView';
import GanttChart from '../components/GanttChart';
import TaskModal from '../components/TaskModal';
import ReportExport from '../components/ReportExport';
import QuickActions from '../components/QuickActions';
import { LayoutGrid, Calendar as CalendarIcon, GanttChartSquare, Plus, Filter } from 'lucide-react';

type ViewMode = 'kanban' | 'calendar' | 'gantt';

const TasksPage = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<TaskWithRelations[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: '' as 'pending' | 'in_progress' | 'completed' | '',
    priority: '' as 'low' | 'medium' | 'high' | '',
    assignedTo: '',
  });

  // Determinar view mode baseado na rota
  useEffect(() => {
    if (location.pathname.includes('/kanban')) {
      setViewMode('kanban');
    } else if (location.pathname.includes('/calendario')) {
      setViewMode('calendar');
    } else if (location.pathname.includes('/gantt')) {
      setViewMode('gantt');
    }
  }, [location.pathname]);

  // Verificar se deve abrir o modal de criação ao carregar a página
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('new') === 'true') {
      setShowTaskModal(true);
      setSelectedTask(null);
      // Remover o parâmetro da URL sem recarregar a página
      navigate(location.pathname, { replace: true });
    }
  }, [location.search, location.pathname, navigate]);

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
        isAdmin ? userService.getUsers() : Promise.resolve([]),
      ]);

      setTasks(tasksData);
      setUsers(usersData);
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

    // Filtrar apenas tarefas do utilizador se não for admin
    if (!isAdmin) {
      filtered = filtered.filter(
        (t) =>
          (Array.isArray(t.assigned_to)
            ? t.assigned_to.includes(user?.id || '')
            : t.assigned_to === user?.id) || t.created_by === user?.id
      );
    }

    setFilteredTasks(filtered);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    const basePath = isAdmin ? '/admin/tarefas' : '/user/tarefas';
    navigate(`${basePath}/${mode === 'calendar' ? 'calendario' : mode}`);
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tarefas</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerir e visualizar todas as suas tarefas
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleViewModeChange('kanban')}
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
            onClick={() => handleViewModeChange('calendar')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              viewMode === 'calendar'
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            Calendário
          </button>
          <button
            onClick={() => handleViewModeChange('gantt')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              viewMode === 'gantt'
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <GanttChartSquare className="w-4 h-4" />
            Gantt
          </button>
        </div>
      </div>

      {/* Filters and Export */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-5 h-5 text-gray-500" />
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

          {isAdmin && users.length > 0 && (
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
          )}

          {(filters.status || filters.priority || filters.assignedTo) && (
            <button
              onClick={() => setFilters({ status: '', priority: '', assignedTo: '' })}
              className="btn btn-secondary text-sm"
            >
              Limpar Filtros
            </button>
          )}
        </div>

        {/* Export (Admin only) */}
        {isAdmin && <ReportExport type="tasks" filters={filters} isAdmin={true} />}
      </div>

      {/* View Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        {viewMode === 'kanban' ? (
          <KanbanBoard
            tasks={filteredTasks}
            onTaskClick={handleEditTask}
            onTaskUpdate={loadData}
            onTaskDelete={handleDeleteTask}
            isAdmin={isAdmin}
            users={users}
          />
        ) : viewMode === 'calendar' ? (
          <CalendarView tasks={filteredTasks} onTaskClick={handleEditTask} />
        ) : (
          <GanttChart tasks={filteredTasks} onTaskClick={handleEditTask} />
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
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
};

export default TasksPage;

