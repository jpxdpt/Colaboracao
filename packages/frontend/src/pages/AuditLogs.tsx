import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Search,
  Filter,
  Calendar,
  User,
  Shield,
  ChevronLeft,
  ChevronRight,
  Eye,
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
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';

interface AuditLogUser {
  _id: string;
  name: string;
  email: string;
  role?: string;
}

interface AuditLog {
  _id: string;
  action: string;
  userId?: AuditLogUser | string;
  resourceType: string;
  resourceId?: string;
  changes?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

interface AuditLogsResponse {
  success: boolean;
  data: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function AuditLogs() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const token = useAuthStore((state) => state.token);
  const isReady = hasHydrated && !!user && !!token;
  const isAdmin = user?.role === 'admin';

  // Build query params
  const queryParams = new URLSearchParams();
  queryParams.set('page', page.toString());
  queryParams.set('limit', '20');
  if (searchQuery) queryParams.set('search', searchQuery);
  if (actionFilter !== 'all') queryParams.set('action', actionFilter);
  if (resourceTypeFilter !== 'all') queryParams.set('resourceType', resourceTypeFilter);
  if (dateFrom) queryParams.set('from', dateFrom);
  if (dateTo) queryParams.set('to', dateTo);

  const { data: logsResponse, isLoading, error } = useQuery({
    queryKey: ['audit-logs', queryParams.toString()],
    queryFn: () => api.get<AuditLogsResponse>(`/api/audit?${queryParams.toString()}`),
    enabled: isReady && isAdmin,
    retry: false,
  });

  const logsData = logsResponse?.data || logsResponse;
  const logs = logsData?.data || [];
  const pagination = logsData?.pagination;

  // Common actions for filter
  const commonActions = [
    'user_login',
    'user_registered',
    'user_role_updated',
    'user_password_reset',
    'password_changed',
    'task_created',
    'task_updated',
    'task_completed',
    'points_awarded',
    'badge_earned',
    'team_created',
    'team_joined',
    'team_left',
  ];

  // Common resource types
  const resourceTypes = ['User', 'Task', 'Goal', 'Team', 'Points', 'Badge', 'Challenge', 'Reward'];

  const handleOpenDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetailsModal(true);
  };

  const formatAction = (action: string) => {
    return action
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getActionColor = (action: string) => {
    if (action.includes('login') || action.includes('registered')) {
      return 'text-green-600 dark:text-green-400';
    }
    if (action.includes('password') || action.includes('reset')) {
      return 'text-orange-600 dark:text-orange-400';
    }
    if (action.includes('role') || action.includes('updated')) {
      return 'text-blue-600 dark:text-blue-400';
    }
    if (action.includes('created')) {
      return 'text-purple-600 dark:text-purple-400';
    }
    if (action.includes('completed') || action.includes('earned')) {
      return 'text-emerald-600 dark:text-emerald-400';
    }
    return 'text-gray-600 dark:text-gray-400';
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
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Logs de Auditoria
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Visualizar todas as ações realizadas no sistema
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Button
              variant="secondary"
              icon={<Filter className="w-5 h-5" />}
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
            </Button>
          </motion.div>
        </div>

        {/* Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <Card className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div className="lg:col-span-2">
                  <Input
                    placeholder="Buscar por ação, tipo de recurso, IP..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    icon={<Search className="w-5 h-5" />}
                  />
                </div>

                {/* Action Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ação
                  </label>
                  <select
                    value={actionFilter}
                    onChange={(e) => {
                      setActionFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
                  >
                    <option value="all">Todas</option>
                    {commonActions.map((action) => (
                      <option key={action} value={action}>
                        {formatAction(action)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Resource Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipo de Recurso
                  </label>
                  <select
                    value={resourceTypeFilter}
                    onChange={(e) => {
                      setResourceTypeFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
                  >
                    <option value="all">Todos</option>
                    {resourceTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date From */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Data Inicial
                  </label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      setPage(1);
                    }}
                    icon={<Calendar className="w-5 h-5" />}
                  />
                </div>

                {/* Date To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Data Final
                  </label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value);
                      setPage(1);
                    }}
                    icon={<Calendar className="w-5 h-5" />}
                  />
                </div>
              </div>

              {/* Clear Filters */}
              {(searchQuery ||
                actionFilter !== 'all' ||
                resourceTypeFilter !== 'all' ||
                dateFrom ||
                dateTo) && (
                <div className="mt-4 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<X className="w-4 h-4" />}
                    onClick={() => {
                      setSearchQuery('');
                      setActionFilter('all');
                      setResourceTypeFilter('all');
                      setDateFrom('');
                      setDateTo('');
                      setPage(1);
                    }}
                  >
                    Limpar Filtros
                  </Button>
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* Logs List */}
        {isLoading ? (
          <LoadingSpinner fullScreen text="Carregando logs de auditoria..." />
        ) : error ? (
          <EmptyState
            icon={FileText}
            title="Erro ao carregar logs"
            description={error instanceof Error ? error.message : 'Erro desconhecido'}
          />
        ) : logs.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Nenhum log encontrado"
            description={
              searchQuery ||
              actionFilter !== 'all' ||
              resourceTypeFilter !== 'all' ||
              dateFrom ||
              dateTo
                ? 'Tente ajustar os filtros'
                : 'Ainda não há logs de auditoria registados'
            }
          />
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {logs.map((log, index) => {
                const user = typeof log.userId === 'object' ? log.userId : null;
                return (
                  <motion.div
                    key={log._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <Card variant="interactive" className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span
                              className={`font-semibold text-sm ${getActionColor(log.action)}`}
                            >
                              {formatAction(log.action)}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                              {log.resourceType}
                            </span>
                            {log.resourceId && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                ID: {log.resourceId.substring(0, 8)}...
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            {user && (
                              <div className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                <span>{user.name}</span>
                                {user.email && (
                                  <span className="text-xs">({user.email})</span>
                                )}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {new Date(log.createdAt).toLocaleString('pt-PT', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            {log.ip && (
                              <span className="text-xs font-mono">{log.ip}</span>
                            )}
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Eye className="w-4 h-4" />}
                          onClick={() => handleOpenDetails(log)}
                        >
                          Detalhes
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Mostrando {((pagination.page - 1) * pagination.limit + 1).toLocaleString('pt-PT')}{' '}
                  a {Math.min(pagination.page * pagination.limit, pagination.total).toLocaleString('pt-PT')}{' '}
                  de {pagination.total.toLocaleString('pt-PT')} logs
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<ChevronLeft className="w-4 h-4" />}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={pagination.page === 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-gray-600 dark:text-gray-400 px-3">
                    Página {pagination.page} de {pagination.pages}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                    disabled={pagination.page === pagination.pages}
                  >
                    Próxima
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Details Modal */}
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedLog(null);
          }}
          title="Detalhes do Log"
          size="lg"
        >
          {selectedLog && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Ação
                </h3>
                <p className={`font-medium ${getActionColor(selectedLog.action)}`}>
                  {formatAction(selectedLog.action)}
                </p>
              </div>

              {typeof selectedLog.userId === 'object' && selectedLog.userId && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Utilizador
                  </h3>
                  <div className="space-y-1">
                    <p className="text-gray-900 dark:text-white">
                      {selectedLog.userId.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedLog.userId.email}
                    </p>
                    {selectedLog.userId.role && (
                      <span className="inline-block px-2 py-1 text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                        {selectedLog.userId.role}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Recurso
                </h3>
                <div className="space-y-1">
                  <p className="text-gray-900 dark:text-white">
                    Tipo: <span className="font-semibold">{selectedLog.resourceType}</span>
                  </p>
                  {selectedLog.resourceId && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                      ID: {selectedLog.resourceId}
                    </p>
                  )}
                </div>
              </div>

              {selectedLog.changes && Object.keys(selectedLog.changes).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Alterações
                  </h3>
                  <pre className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.changes, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Metadados
                  </h3>
                  <pre className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Data/Hora
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(selectedLog.createdAt).toLocaleString('pt-PT', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </p>
                </div>

                {selectedLog.ip && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      IP
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                      {selectedLog.ip}
                    </p>
                  </div>
                )}
              </div>

              {selectedLog.userAgent && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    User Agent
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 break-all">
                    {selectedLog.userAgent}
                  </p>
                </div>
              )}
            </div>
          )}
        </Modal>
      </Container>
    </Layout>
  );
}

