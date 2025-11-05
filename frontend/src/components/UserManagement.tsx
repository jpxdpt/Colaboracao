import { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import { User } from '../types';
import { X, Trash2, Shield, User as UserIcon } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale/pt';

interface UserManagementProps {
  onClose: () => void;
  onUpdate: () => void;
}

const UserManagement = ({ onClose, onUpdate }: UserManagementProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, statsData] = await Promise.all([
        userService.getUsers(),
        userService.getUserStats(),
      ]);
      setUsers(usersData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      await userService.updateUserRole(userId, newRole);
      loadData();
      onUpdate();
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Erro ao atualizar role do utilizador');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Tem a certeza que deseja eliminar este utilizador?')) {
      return;
    }

    try {
      await userService.deleteUser(userId);
      loadData();
      onUpdate();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert(error.response?.data?.error || 'Erro ao eliminar utilizador');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gestão de Utilizadores</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Estatísticas */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="card bg-blue-50">
                <div className="text-sm text-gray-600 mb-1">Total de Utilizadores</div>
                <div className="text-2xl font-bold text-gray-900">{stats.total_users}</div>
              </div>
              <div className="card bg-purple-50">
                <div className="text-sm text-gray-600 mb-1">Administradores</div>
                <div className="text-2xl font-bold text-gray-900">{stats.total_admins}</div>
              </div>
              <div className="card bg-green-50">
                <div className="text-sm text-gray-600 mb-1">Utilizadores Regulares</div>
                <div className="text-2xl font-bold text-gray-900">{stats.total_regular_users}</div>
              </div>
            </div>
          )}

          {/* Lista de Utilizadores */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Utilizadores</h3>
            {users.map((user) => (
              <div
                key={user.id}
                className="card flex items-center justify-between hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-3 bg-primary-100 rounded-full">
                    {user.role === 'admin' ? (
                      <Shield className="w-5 h-5 text-primary-600" />
                    ) : (
                      <UserIcon className="w-5 h-5 text-primary-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-600">{user.email}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Registado em{' '}
                      {format(new Date(user.created_at), "d 'de' MMMM 'de' yyyy", { locale: pt })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {user.role === 'admin' ? 'Administrador' : 'Utilizador'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      handleUpdateRole(user.id, user.role === 'admin' ? 'user' : 'admin')
                    }
                    className="btn btn-secondary text-sm"
                  >
                    {user.role === 'admin' ? 'Remover Admin' : 'Tornar Admin'}
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="btn btn-danger p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Estatísticas de Tarefas por Utilizador */}
          {stats && stats.tasks_by_user && stats.tasks_by_user.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Estatísticas de Tarefas por Utilizador
              </h3>
              <div className="space-y-3">
                {stats.tasks_by_user.map((userStat: any) => (
                  <div key={userStat.id} className="card">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-semibold text-gray-900">{userStat.name}</div>
                        <div className="text-sm text-gray-600">{userStat.email}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {userStat.total_tasks} tarefas
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div className="text-center">
                        <div className="text-sm text-gray-600">Pendentes</div>
                        <div className="text-xl font-semibold text-yellow-600">
                          {userStat.pending_tasks}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600">Em Progresso</div>
                        <div className="text-xl font-semibold text-blue-600">
                          {userStat.in_progress_tasks}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600">Concluídas</div>
                        <div className="text-xl font-semibold text-green-600">
                          {userStat.completed_tasks}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;

