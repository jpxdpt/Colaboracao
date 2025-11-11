import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon,
  User,
  Lock,
  Bell,
  Moon,
  Sun,
  Shield,
  Mail,
  Download,
  Trash2,
  AlertTriangle,
  FileText,
  Eye,
  Type,
  Move,
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import Container from '../components/layout/Container';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { useAccessibilityStore } from '../stores/accessibilityStore';
import { useNavigate } from 'react-router-dom';

interface UserProfile {
  _id: string;
  email: string;
  name: string;
  department: string;
  role: string;
  avatar?: string;
  preferences: {
    notifications: {
      achievements: boolean;
      tasks: boolean;
      goals: boolean;
      challenges: boolean;
      recognition: boolean;
      streaks: boolean;
      levelUps: boolean;
      email: boolean;
    };
    theme: 'light' | 'dark';
    language: string;
    privacy: {
      showProfile: boolean;
      showStats: boolean;
      showBadges: boolean;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export default function Settings() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const token = useAuthStore((state) => state.token);
  const isReady = hasHydrated && !!user && !!token;
  const { theme, toggleTheme } = useThemeStore();
  const { highContrast, reducedMotion, fontSize, toggleHighContrast, toggleReducedMotion, setFontSize } = useAccessibilityStore();
  const navigate = useNavigate();

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const { data: profile, isLoading, error: profileError } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get<{ success: boolean; data: { user: UserProfile } }>('/api/auth/me'),
    enabled: isReady,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      api.put('/api/auth/change-password', data),
    onSuccess: () => {
      toast.success('Senha alterada com sucesso!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setPasswordErrors({});
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao alterar senha');
    },
  });

  const exportDataMutation = useMutation({
    mutationFn: async () => {
      const state = useAuthStore.getState();
      const currentToken = state.token;

      if (!currentToken) {
        throw new Error('Não autenticado');
      }

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

      const apiUrl = getApiUrl();

      const response = await fetch(`${apiUrl}/api/auth/me/export`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Erro ao exportar dados');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `taskify-dados-${user?.id || 'user'}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast.success('Dados exportados com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao exportar dados');
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: () => api.delete('/api/auth/me'),
    onSuccess: () => {
      toast.success('Conta eliminada com sucesso');
      logout();
      setTimeout(() => {
        navigate('/login');
      }, 1000);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao eliminar conta');
    },
  });

  const validatePassword = () => {
    const errors: typeof passwordErrors = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Senha atual é obrigatória';
    }

    if (!passwordData.newPassword) {
      errors.newPassword = 'Nova senha é obrigatória';
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = 'Senha deve ter pelo menos 8 caracteres';
    }

    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Confirme a nova senha';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'As senhas não coincidem';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePassword()) {
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText !== 'ELIMINAR') {
      toast.error('Por favor, digite "ELIMINAR" para confirmar');
      return;
    }
    deleteAccountMutation.mutate();
  };

  // Usar dados do perfil se disponível, senão usar dados do store
  const userData = profile?.data?.user || (user ? {
    _id: user.id,
    email: user.email,
    name: user.name,
    department: '',
    role: user.role,
    avatar: user.avatar,
    preferences: {
      notifications: {
        achievements: true,
        tasks: true,
        goals: true,
        challenges: true,
        recognition: true,
        streaks: true,
        levelUps: true,
        email: true,
      },
      theme: theme,
      language: 'pt',
      privacy: {
        showProfile: true,
        showStats: true,
        showBadges: true,
      },
    },
    createdAt: '',
    updatedAt: '',
  } : null);

  // Se não houver dados do usuário, mostrar loading
  if (!userData) {
    return (
      <Layout>
        <Container>
          <LoadingSpinner fullScreen text="Carregando configurações..." />
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Configurações</h1>
          <p className="text-gray-600">Gerencie suas preferências e informações da conta</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Perfil */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-purple rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Informações do Perfil</h2>
                  <p className="text-sm text-gray-600">Suas informações pessoais</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                  <Input value={userData?.name || ''} disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <Input value={userData?.email || ''} disabled icon={<Mail className="w-5 h-5" />} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                  <Input value={userData?.department || ''} disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Função</label>
                  <Input value={userData?.role || ''} disabled />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Configurações Rápidas */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <div className="flex items-center gap-4 mb-6">
                <SettingsIcon className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-semibold text-gray-900">Configurações Rápidas</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    {theme === 'dark' ? (
                      <Moon className="w-5 h-5 text-gray-600" />
                    ) : (
                      <Sun className="w-5 h-5 text-gray-600" />
                    )}
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tema {theme === 'dark' ? 'Escuro' : 'Claro'}
                    </span>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                    aria-label="Alternar entre tema claro e escuro"
                  >
                    Alternar
                  </button>
                </div>
              </div>
            </Card>

            {/* Acessibilidade */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className="mt-6"
            >
              <Card>
                <div className="flex items-center gap-4 mb-6">
                  <Eye className="w-6 h-6 text-purple-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Acessibilidade</h2>
                </div>

                <div className="space-y-4">
                  {/* Alto Contraste */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Eye className="w-5 h-5 text-gray-600" />
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                          Alto Contraste
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Melhora a visibilidade
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={toggleHighContrast}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        highContrast
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                      aria-label={highContrast ? 'Desativar alto contraste' : 'Ativar alto contraste'}
                      aria-pressed={highContrast}
                    >
                      {highContrast ? 'Ativo' : 'Inativo'}
                    </button>
                  </div>

                  {/* Reduzir Movimento */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Move className="w-5 h-5 text-gray-600" />
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                          Reduzir Movimento
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Minimiza animações
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={toggleReducedMotion}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        reducedMotion
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                      aria-label={reducedMotion ? 'Desativar redução de movimento' : 'Ativar redução de movimento'}
                      aria-pressed={reducedMotion}
                    >
                      {reducedMotion ? 'Ativo' : 'Inativo'}
                    </button>
                  </div>

                  {/* Tamanho da Fonte */}
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <Type className="w-5 h-5 text-gray-600" />
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                          Tamanho da Fonte
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Ajuste o tamanho do texto
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {(['normal', 'large', 'extra-large'] as const).map((size) => (
                        <button
                          key={size}
                          onClick={() => setFontSize(size)}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            fontSize === size
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                          }`}
                          aria-label={`Definir tamanho da fonte como ${size}`}
                          aria-pressed={fontSize === size}
                        >
                          {size === 'normal' ? 'Normal' : size === 'large' ? 'Grande' : 'Extra Grande'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>

          {/* Alterar Senha */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Card>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Lock className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Alterar Senha</h2>
                  <p className="text-sm text-gray-600">Atualize sua senha de acesso</p>
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <Input
                  type="password"
                  label="Senha Atual"
                  value={passwordData.currentPassword}
                  onChange={(e) => {
                    setPasswordData({ ...passwordData, currentPassword: e.target.value });
                    if (passwordErrors.currentPassword) {
                      setPasswordErrors({ ...passwordErrors, currentPassword: undefined });
                    }
                  }}
                  error={passwordErrors.currentPassword}
                  icon={<Lock className="w-5 h-5" />}
                  placeholder="Digite sua senha atual"
                />

                <Input
                  type="password"
                  label="Nova Senha"
                  value={passwordData.newPassword}
                  onChange={(e) => {
                    setPasswordData({ ...passwordData, newPassword: e.target.value });
                    if (passwordErrors.newPassword) {
                      setPasswordErrors({ ...passwordErrors, newPassword: undefined });
                    }
                  }}
                  error={passwordErrors.newPassword}
                  icon={<Lock className="w-5 h-5" />}
                  placeholder="Mínimo 8 caracteres"
                />

                <Input
                  type="password"
                  label="Confirmar Nova Senha"
                  value={passwordData.confirmPassword}
                  onChange={(e) => {
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value });
                    if (passwordErrors.confirmPassword) {
                      setPasswordErrors({ ...passwordErrors, confirmPassword: undefined });
                    }
                  }}
                  error={passwordErrors.confirmPassword}
                  icon={<Lock className="w-5 h-5" />}
                  placeholder="Digite a senha novamente"
                />

                <Button
                  type="submit"
                  variant="gamified"
                  disabled={changePasswordMutation.isPending}
                  className="w-full"
                >
                  {changePasswordMutation.isPending ? 'Alterando...' : 'Alterar Senha'}
                </Button>
              </form>
            </Card>
          </motion.div>

          {/* Conformidade de Dados (LGPD) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2"
          >
            <Card>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Conformidade de Dados (LGPD)
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Gerir os seus dados pessoais conforme a Lei Geral de Proteção de Dados
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Informações sobre Privacidade */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                        Os seus Direitos
                      </h3>
                      <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                        <li>Acesso aos seus dados pessoais</li>
                        <li>Exportação dos seus dados em formato legível</li>
                        <li>Eliminação dos seus dados pessoais</li>
                        <li>Retificação de dados incorretos</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Exportar Dados */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        Exportar Dados Pessoais
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Faça o download de todos os seus dados pessoais em formato JSON. Inclui
                        tarefas, metas, pontos, badges, equipas e histórico de atividades.
                      </p>
                      <Button
                        variant="secondary"
                        icon={<Download className="w-5 h-5" />}
                        onClick={() => exportDataMutation.mutate()}
                        disabled={exportDataMutation.isPending}
                      >
                        {exportDataMutation.isPending ? 'A exportar...' : 'Exportar Dados'}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Eliminar Conta */}
                <div className="border border-red-200 dark:border-red-800 rounded-xl p-4 bg-red-50 dark:bg-red-900/20">
                  <div className="flex items-start gap-3 mb-4">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                        Eliminar Conta Permanentemente
                      </h3>
                      <p className="text-sm text-red-800 dark:text-red-200 mb-4">
                        Esta ação não pode ser desfeita. Todos os seus dados serão eliminados
                        permanentemente, incluindo:
                      </p>
                      <ul className="text-sm text-red-800 dark:text-red-200 space-y-1 list-disc list-inside mb-4">
                        <li>Perfil e informações pessoais</li>
                        <li>Tarefas e metas associadas</li>
                        <li>Pontos e badges ganhos</li>
                        <li>Histórico de atividades</li>
                        <li>Membros de equipas</li>
                      </ul>
                      <Button
                        variant="danger"
                        icon={<Trash2 className="w-5 h-5" />}
                        onClick={() => setShowDeleteModal(true)}
                        disabled={deleteAccountMutation.isPending}
                      >
                        Eliminar Conta
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Delete Account Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setDeleteConfirmText('');
          }}
          title="Confirmar Eliminação de Conta"
          size="md"
        >
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-900 dark:text-red-100 mb-2">
                    Atenção: Esta ação é permanente e irreversível!
                  </p>
                  <p className="text-sm text-red-800 dark:text-red-200">
                    Todos os seus dados serão eliminados permanentemente do sistema. Esta ação não
                    pode ser desfeita.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Para confirmar, digite <strong className="text-red-600">ELIMINAR</strong>:
              </label>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Digite ELIMINAR para confirmar"
                className="font-mono"
              />
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteAccount}
                disabled={deleteAccountMutation.isPending || deleteConfirmText !== 'ELIMINAR'}
              >
                {deleteAccountMutation.isPending ? 'A eliminar...' : 'Eliminar Conta Permanentemente'}
              </Button>
            </div>
          </div>
        </Modal>
      </Container>
    </Layout>
  );
}

