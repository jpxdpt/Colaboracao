import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { taskService } from '../services/taskService';
import { userService } from '../services/userService';
import { TaskWithRelations, User } from '../types';
import StatsCards from '../components/StatsCards';
import AdvancedStats from '../components/AdvancedStats';
import NotificationCenter from '../components/NotificationCenter';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';

const DashboardPage = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksData, usersData] = await Promise.all([
        taskService.getTasks({}),
        isAdmin ? userService.getUsers() : Promise.resolve([]),
      ]);

      setTasks(tasksData);
      setUsers(usersData);

      const myTasks = isAdmin
        ? tasksData
        : tasksData.filter(
            (t) =>
              (Array.isArray(t.assigned_to)
                ? t.assigned_to.includes(user?.id || '')
                : t.assigned_to === user?.id) || t.created_by === user?.id
          );

      setStats({
        total: myTasks.length,
        pending: myTasks.filter((t) => t.status === 'pending').length,
        in_progress: myTasks.filter((t) => t.status === 'in_progress').length,
        completed: myTasks.filter((t) => t.status === 'completed').length,
      });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const handleCreateTask = () => {
    navigate(`${isAdmin ? '/admin/tarefas/kanban' : '/user/tarefas/kanban'}?new=true`);
  };

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Visão geral das suas tarefas e estatísticas
          </p>
        </div>
        {/* Botão de Notificações */}
        <NotificationCenter />
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Advanced Stats */}
      <AdvancedStats tasks={tasks} users={users} isAdmin={isAdmin} />

      {/* Botão Flutuante para Nova Tarefa */}
      <button
        onClick={handleCreateTask}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-40 group"
        title="Nova Tarefa"
      >
        <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
      </button>
    </div>
  );
};

export default DashboardPage;

