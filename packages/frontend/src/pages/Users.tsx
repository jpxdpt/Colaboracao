import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users as UsersIcon,
  Search,
  Mail,
  Building2,
  Trophy,
  Award,
  Coins,
  Shield,
  Download,
  Key,
  UserCog,
  Filter,
  ArrowUpDown,
  X,
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import Container from '../components/layout/Container';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { UserRole } from '@gamify/shared';
import toast from 'react-hot-toast';

const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    const devTunnelMatch = origin.match(/https:\/\/([a-z0-9-]+)-(\d+)\.[^/]+/);
    if (devTunnelMatch) {
      const subdomain = devTunnelMatch[1];
      return `https://${subdomain}-3000.uks1.devtunnels.ms`;
    }
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:3000';
};

interface UserStats {
  totalPoints: number;
  currentLevel: number;
  badgesCount: number;
}

interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  department: string;
  role: string;
  createdAt: string;
  stats: UserStats;
}

type SortField = 'name' | 'email' | 'department' | 'createdAt' | 'stats.totalPoints';
type SortOrder = 'asc' | 'desc';

export default function Users() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<UserRole>(UserRole.USER);

  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const token = useAuthStore((state) => state.token);
  const isReady = hasHydrated && !!user && !!token;
  const isAdmin = user?.role === UserRole.ADMIN;
  const queryClient = useQueryClient();

  // Build query params
  const queryParams = new URLSearchParams();
  if (searchQuery) queryParams.set('search', searchQuery);
  if (roleFilter !== 'all') queryParams.set('role', roleFilter);
  if (departmentFilter !== 'all') queryParams.set('department', departmentFilter);
  queryParams.set('sortBy', sortBy);
  queryParams.set('order', sortOrder);

  const { data: usersResponse, isLoading, error } = useQuery({
    queryKey: ['admin-users', queryParams.toString()],
    queryFn: () =>
      api.get<{ success: boolean; data: User[] }>(`/api/auth/users?${queryParams.toString()}`),
    enabled: isReady && isAdmin,
    retry: false,
  });

  // A resposta da API é { success: boolean, data: User[] }
  const usersData: User[] = useMemo(() => {
    if (!usersResponse) return [];
    
    // O backend retorna { success: true, data: User[] }
    if (usersResponse && typeof usersResponse === 'object' && 'data' in usersResponse) {
      return Array.isArray(usersResponse.data) ? usersResponse.data : [];
    }
    // Fallback: se for array direto
    if (Array.isArray(usersResponse)) {
      return usersResponse;
    }
    
    return [];
  }, [usersResponse]);

  // Get unique departments for filter
  const departments = Array.from(
    new Set(usersData?.map((u) => u.department) || [])
  ).sort();

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      api.patch(`/api/auth/users/${userId}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Role atualizado com sucesso!');
      setShowRoleModal(false);
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar role');
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (userId: string) => api.post(`/api/auth/users/${userId}/reset-password`, {}),
    onSuccess: (data: { success: boolean; data: { temporaryPassword: string } }) => {
      toast.success(`Password resetada! Nova password: ${data.data.temporaryPassword}`, {
        duration: 10000,
      });
      setShowPasswordModal(false);
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao resetar password');
    },
  });

  const handleExportCSV = async () => {
    try {
      const state = useAuthStore.getState();
      const currentToken = state.token;
      
      if (!currentToken) {
        toast.error('Não autenticado');
        return;
      }

      const apiUrl = getApiUrl();

      const response = await fetch(
        `${apiUrl}/api/auth/users/export/csv?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Erro ao exportar CSV');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('CSV exportado com sucesso!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao exportar CSV');
    }
  };

  const handleOpenRoleModal = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.role as UserRole);
    setShowRoleModal(true);
  };

  const handleOpenPasswordModal = (user: User) => {
    setSelectedUser(user);
    setShowPasswordModal(true);
  };

  const handleUpdateRole = () => {
    if (!selectedUser) return;
    updateRoleMutation.mutate({ userId: selectedUser._id, role: newRole });
  };

  const handleResetPassword = () => {
    if (!selectedUser) return;
    if (
      confirm(
        `Tem certeza que deseja resetar a password de ${selectedUser.name}? Uma nova password temporária será gerada.`
      )
    ) {
      resetPasswordMutation.mutate(selectedUser._id);
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  if (!isAdmin) {
    return (
      <Layout>
        <Container>
          <EmptyState
            icon={Shield}
            title="Acesso Negado"
            description="Apenas administradores podem aceder a esta página."
          />
        </Container>
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
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">Utilizadores</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Gerir e visualizar todos os utilizadores do sistema
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Button
              variant="gamified"
              icon={<Download className="w-5 h-5" />}
              onClick={handleExportCSV}
            >
              Exportar CSV
            </Button>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 space-y-4"
        >
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Filtros</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <Input
                  placeholder="Buscar por nome, email ou departamento..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={<Search className="w-5 h-5" />}
                />
              </div>

              {/* Role Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role
                </label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="all">Todos</option>
                  <option value="user">User</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Department Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Departamento
                </label>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="all">Todos</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sort */}
            <div className="mt-4 flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Ordenar por:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortField)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
              >
                <option value="name">Nome</option>
                <option value="email">Email</option>
                <option value="department">Departamento</option>
                <option value="createdAt">Data de Registo</option>
                <option value="stats.totalPoints">Pontos</option>
              </select>
              <Button
                variant="ghost"
                size="sm"
                icon={<ArrowUpDown className="w-4 h-4" />}
                onClick={toggleSortOrder}
              >
                {sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Users List */}
        {isLoading ? (
          <LoadingSpinner fullScreen text="Carregando utilizadores..." />
        ) : error ? (
          <EmptyState
            icon={UsersIcon}
            title="Erro ao carregar utilizadores"
            description={error instanceof Error ? error.message : 'Erro desconhecido'}
          />
        ) : !usersData || usersData.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title="Nenhum utilizador encontrado"
            description={
              searchQuery || roleFilter !== 'all' || departmentFilter !== 'all'
                ? 'Tente ajustar os filtros'
                : 'Ainda não há utilizadores registados'
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {usersData?.map((userItem, index) => (
              <motion.div
                key={userItem._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card variant="interactive" glow="purple">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <img
                        src={
                          userItem.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            userItem.name || userItem.email
                          )}&background=random`
                        }
                        alt={userItem.name}
                        className="w-16 h-16 rounded-xl object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white truncate">
                          {userItem.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          {userItem.role === 'admin' && (
                            <span className="px-2 py-0.5 text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              Admin
                            </span>
                          )}
                          {userItem.role === 'supervisor' && (
                            <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                              Supervisor
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Email */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{userItem.email}</span>
                    </div>

                    {/* Department */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Building2 className="w-4 h-4" />
                      <span>{userItem.department}</span>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                      {/* Points */}
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-purple-600 dark:text-purple-400 mb-1">
                          <Coins className="w-4 h-4" />
                        </div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {userItem.stats?.totalPoints || 0}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Pontos</div>
                      </div>

                      {/* Level */}
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-blue-600 dark:text-blue-400 mb-1">
                          <Trophy className="w-4 h-4" />
                        </div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {userItem.stats?.currentLevel || 1}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Nível</div>
                      </div>

                      {/* Badges */}
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400 mb-1">
                          <Award className="w-4 h-4" />
                        </div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {userItem.stats?.badgesCount || 0}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Badges</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<UserCog className="w-4 h-4" />}
                        onClick={() => handleOpenRoleModal(userItem)}
                        className="flex-1"
                      >
                        Alterar Role
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Key className="w-4 h-4" />}
                        onClick={() => handleOpenPasswordModal(userItem)}
                        className="flex-1"
                      >
                        Reset Password
                      </Button>
                    </div>

                    {/* Created Date */}
                    <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
                      Registado em:{' '}
                      {new Date(userItem.createdAt).toLocaleDateString('pt-PT', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Role Update Modal */}
        <Modal
          isOpen={showRoleModal}
          onClose={() => {
            setShowRoleModal(false);
            setSelectedUser(null);
          }}
          title="Alterar Role"
          size="sm"
        >
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Alterar role de <strong>{selectedUser.name}</strong>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                  Role atual: <span className="font-semibold">{selectedUser.role}</span>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Novo Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="user">User</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowRoleModal(false);
                    setSelectedUser(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="gamified"
                  onClick={handleUpdateRole}
                  disabled={updateRoleMutation.isPending || newRole === selectedUser.role}
                >
                  {updateRoleMutation.isPending ? 'A guardar...' : 'Guardar'}
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Password Reset Modal */}
        <Modal
          isOpen={showPasswordModal}
          onClose={() => {
            setShowPasswordModal(false);
            setSelectedUser(null);
          }}
          title="Resetar Password"
          size="sm"
        >
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Tem certeza que deseja resetar a password de <strong>{selectedUser.name}</strong>?
                </p>
                <p className="text-xs text-red-600 dark:text-red-400">
                  Uma nova password temporária será gerada e exibida após a confirmação.
                </p>
              </div>
              <div className="flex gap-2 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setSelectedUser(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="danger"
                  onClick={handleResetPassword}
                  disabled={resetPasswordMutation.isPending}
                >
                  {resetPasswordMutation.isPending ? 'A resetar...' : 'Resetar Password'}
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </Container>
    </Layout>
  );
}
