import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Filter, Search, AlertCircle, CheckCircle2, Clock, XCircle, FileText } from 'lucide-react';
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
import { useAuthStore } from '../stores/authStore';

interface Report {
  _id: string;
  title: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  reportedBy?: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function Reports() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const token = useAuthStore((state) => state.token);
  const isReady = hasHydrated && !!user && !!token;

  const { data: reports, isLoading } = useQuery({
    queryKey: ['reports', filterStatus, filterSeverity],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterSeverity !== 'all') params.append('severity', filterSeverity);
      return api.get<Report[]>(`/api/reports${params.toString() ? `?${params.toString()}` : ''}`);
    },
    enabled: isReady,
    retry: false,
  });

  const createReportMutation = useMutation({
    mutationFn: (data: {
      title: string;
      description: string;
      category: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
    }) => api.post('/api/reports', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Reporte criado com sucesso!');
      setShowCreateModal(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar reporte');
    },
  });

  const filteredReports =
    reports?.filter((report) =>
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
      case 'closed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'in-progress':
        return <Clock className="w-5 h-5 text-blue-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open':
        return 'Aberto';
      case 'in-progress':
        return 'Em Progresso';
      case 'resolved':
        return 'Resolvido';
      case 'closed':
        return 'Fechado';
      default:
        return status;
    }
  };

  const handleCreateReport = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      category: formData.get('category') as string,
      severity: (formData.get('severity') as 'low' | 'medium' | 'high' | 'critical') || 'medium',
    };
    createReportMutation.mutate(data);
  };

  return (
    <Layout>
      <Container>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Reportes</h1>
            <p className="text-gray-600">Gerencie reportes e problemas</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Button
              variant="gamified"
              icon={<Plus className="w-5 h-5" />}
              onClick={() => setShowCreateModal(true)}
            >
              Novo Reporte
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
              placeholder="Buscar reportes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-5 h-5" />}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'open', 'in-progress', 'resolved', 'closed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  filterStatus === status
                    ? 'bg-gradient-purple text-white shadow-glow-purple'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {status === 'all' ? 'Todos' : getStatusLabel(status)}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {['all', 'low', 'medium', 'high', 'critical'].map((severity) => (
              <button
                key={severity}
                onClick={() => setFilterSeverity(severity)}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  filterSeverity === severity
                    ? 'bg-gradient-purple text-white shadow-glow-purple'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {severity === 'all' ? 'Todas' : severity.charAt(0).toUpperCase() + severity.slice(1)}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Reports Grid */}
        {isLoading ? (
          <LoadingSpinner fullScreen text="Carregando reportes..." />
        ) : filteredReports.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Nenhum reporte encontrado"
            description={
              searchQuery
                ? 'Tente ajustar seus filtros de busca'
                : 'Comece criando seu primeiro reporte!'
            }
            action={
              <Button variant="gamified" onClick={() => setShowCreateModal(true)}>
                Criar Reporte
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReports.map((report, index) => (
              <motion.div
                key={report._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card variant="interactive" glow="purple">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2 flex-1">
                      {getStatusIcon(report.status)}
                      <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">
                        {report.title}
                      </h3>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-lg text-xs font-semibold border ${getSeverityColor(
                        report.severity
                      )}`}
                    >
                      {report.severity}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {report.description}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span className="px-2 py-1 bg-gray-100 rounded-lg">
                      {report.category}
                    </span>
                    <span>{getStatusLabel(report.status)}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    {report.reportedBy && (
                      <span>Por: {report.reportedBy.name}</span>
                    )}
                    <span>
                      {new Date(report.createdAt).toLocaleDateString('pt-PT')}
                    </span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Create Report Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Novo Reporte"
          size="md"
        >
          <form onSubmit={handleCreateReport} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título
              </label>
              <Input
                name="title"
                required
                placeholder="Descreva o problema..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                name="description"
                required
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Detalhes do problema..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoria
              </label>
              <Input
                name="category"
                required
                placeholder="Ex: Bug, Melhoria, Dúvida..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Severidade
              </label>
              <select
                name="severity"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                defaultValue="medium"
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
                <option value="critical">Crítica</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowCreateModal(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="gamified"
                disabled={createReportMutation.isPending}
              >
                {createReportMutation.isPending ? 'Criando...' : 'Criar Reporte'}
              </Button>
            </div>
          </form>
        </Modal>
      </Container>
    </Layout>
  );
}

