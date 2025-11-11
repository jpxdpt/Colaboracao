import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Users,
  Trophy,
  UserPlus,
  Crown,
  LogOut,
  Edit3,
  Mail,
} from 'lucide-react';
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

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface TeamChatMessage {
  _id: string;
  content: string;
  createdAt: string;
  user?: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

interface Team {
  _id: string;
  name: string;
  description?: string;
  avatar?: string;
  logo?: string;
  totalPoints: number;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  members: TeamMember[];
  activeChallenges?: string[];
  createdAt: string;
  updatedAt: string;
}

export default function Teams() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [teamBeingEdited, setTeamBeingEdited] = useState<Team | null>(null);
  const [teamBeingViewed, setTeamBeingViewed] = useState<Team | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    avatar: '',
    logo: '',
  });
  const [newMessage, setNewMessage] = useState('');
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const token = useAuthStore((state) => state.token);
  const isReady = hasHydrated && !!user && !!token;
  const isAdmin = user?.role === 'admin';

  const { data: teams, isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: () => api.get<Team[]>('/api/gamification/teams'),
    enabled: isReady,
    retry: false,
  });

  const {
    data: teamMessages,
    isLoading: teamMessagesLoading,
    refetch: refetchTeamMessages,
  } = useQuery({
    queryKey: ['teamMessages', teamBeingViewed?._id],
    queryFn: () =>
      api.get<TeamChatMessage[]>(`/api/gamification/teams/${teamBeingViewed?._id}/messages`),
    enabled: isReady && showDetailsModal && !!teamBeingViewed?._id,
    retry: false,
    refetchInterval: 10000,
  });

  const createTeamMutation = useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      avatar?: string;
      logo?: string;
    }) => api.post('/api/gamification/teams', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Equipa criada com sucesso!');
      setShowCreateModal(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar equipa');
    },
  });

  const joinTeamMutation = useMutation({
    mutationFn: (teamId: string) =>
      api.post(`/api/gamification/teams/${teamId}/join`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Juntou-se à equipa com sucesso!');
      setShowDetailsModal(false);
      setTeamBeingViewed(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao juntar-se à equipa');
    },
  });

  const leaveTeamMutation = useMutation({
    mutationFn: (teamId: string) => api.post(`/api/gamification/teams/${teamId}/leave`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Saiu da equipa.');
      setShowDetailsModal(false);
      setTeamBeingViewed(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao sair da equipa');
    },
  });

  const updateTeamMutation = useMutation({
    mutationFn: (payload: { teamId: string; data: { name?: string; description?: string; avatar?: string; logo?: string } }) =>
      api.put(`/api/gamification/teams/${payload.teamId}`, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Equipa atualizada com sucesso!');
      setShowEditModal(false);
      setTeamBeingEdited(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar equipa');
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ teamId, content }: { teamId: string; content: string }) =>
      api.post(`/api/gamification/teams/${teamId}/messages`, { content }),
    onSuccess: () => {
      if (teamBeingViewed?._id) {
        queryClient.invalidateQueries({ queryKey: ['teamMessages', teamBeingViewed._id] });
      }
      setNewMessage('');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao enviar mensagem');
    },
  });

  const filteredTeams =
    teams?.filter(
      (team) =>
        team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        team.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  const isUserMember = (team: Team): boolean => {
    if (!user) return false;
    return team.members.some((member) => member._id === user.id);
  };

  const isUserCreator = (team: Team): boolean => {
    if (!user) return false;
    return team.createdBy?._id === user.id;
  };

  const handleCreateTeam = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || undefined,
      avatar: (formData.get('avatar') as string) || undefined,
      logo: (formData.get('logo') as string) || undefined,
    };
    createTeamMutation.mutate(data);
  };

  const handleJoinTeam = (teamId: string) => {
    joinTeamMutation.mutate(teamId);
  };

  const handleLeaveTeam = (teamId: string) => {
    leaveTeamMutation.mutate(teamId);
  };

  const handleOpenEditModal = (team: Team) => {
    setTeamBeingEdited(team);
    setEditForm({
      name: team.name || '',
      description: team.description || '',
      avatar: team.avatar || '',
      logo: team.logo || '',
    });
    setShowEditModal(true);
  };

  const handleOpenDetailsModal = (team: Team) => {
    setTeamBeingViewed(team);
    setShowDetailsModal(true);
    setNewMessage('');
    setTimeout(() => {
      refetchTeamMessages();
    }, 0);
  };

  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!teamBeingViewed?._id || !newMessage.trim()) return;
    sendMessageMutation.mutate({
      teamId: teamBeingViewed._id,
      content: newMessage.trim(),
    });
  };

  const handleUpdateTeam = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!teamBeingEdited) return;
    updateTeamMutation.mutate({
      teamId: teamBeingEdited._id,
      data: {
        name: editForm.name.trim() || undefined,
        description: editForm.description.trim() || undefined,
        avatar: editForm.avatar.trim() || undefined,
        logo: editForm.logo.trim() || undefined,
      },
    });
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
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Equipas</h1>
            <p className="text-gray-600">Trabalhe em equipa e ganhe pontos juntos!</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            {isAdmin && (
              <Button
                variant="gamified"
                icon={<Plus className="w-5 h-5" />}
                onClick={() => setShowCreateModal(true)}
              >
                Nova Equipa
              </Button>
            )}
          </motion.div>
        </div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Input
            placeholder="Buscar equipas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-5 h-5" />}
          />
        </motion.div>

        {/* Teams Grid */}
        {isLoading ? (
          <LoadingSpinner fullScreen text="Carregando equipas..." />
        ) : filteredTeams.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nenhuma equipa encontrada"
            description={
              searchQuery
                ? 'Tente ajustar sua busca'
                : 'Comece criando sua primeira equipa!'
            }
            action={
              isAdmin ? (
                <Button variant="gamified" onClick={() => setShowCreateModal(true)}>
                  Criar Equipa
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeams.map((team, index) => (
              <motion.div
                key={team._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  variant="interactive"
                  glow="purple"
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('button')) return;
                    handleOpenDetailsModal(team);
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      {team.avatar || team.logo ? (
                        <img
                          src={team.avatar || team.logo}
                          alt={team.name}
                          className="w-12 h-12 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-purple flex items-center justify-center">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">
                          {team.name}
                        </h3>
                        {isUserCreator(team) && (
                          <div className="flex items-center gap-1 text-xs text-purple-600 mt-1">
                            <Crown className="w-3 h-3" />
                            <span>Criador</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-purple-600 font-semibold">
                      <Trophy className="w-5 h-5" />
                      <span>{team.totalPoints}</span>
                    </div>
                  </div>

                  {team.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {team.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {team.members.length} membro{team.members.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {team.createdBy && (
                      <span className="text-xs text-gray-500">
                        Por: {team.createdBy.name}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {!isUserMember(team) && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetailsModal(team);
                        }}
                        className="w-full"
                      >
                        Ver detalhes
                      </Button>
                    )}
                    {isUserMember(team) && (
                      <>
                        <div className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium text-center">
                          Membro
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<LogOut className="w-4 h-4" />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLeaveTeam(team._id);
                          }}
                          disabled={leaveTeamMutation.isPending}
                        >
                          {leaveTeamMutation.isPending ? 'A sair...' : 'Sair da equipa'}
                        </Button>
                      </>
                    )}
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Edit3 className="w-4 h-4" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditModal(team);
                        }}
                      >
                        Editar
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Create Team Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Nova Equipa"
          size="md"
        >
          <form onSubmit={handleCreateTeam} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Equipa
              </label>
              <Input
                name="name"
                required
                placeholder="Ex: Equipa de Desenvolvimento"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                name="description"
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Descreva a equipa..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Avatar URL (opcional)
              </label>
              <Input
                name="avatar"
                type="url"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Logo URL (opcional)
              </label>
              <Input
                name="logo"
                type="url"
                placeholder="https://..."
              />
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
                disabled={createTeamMutation.isPending}
              >
                {createTeamMutation.isPending ? 'Criando...' : 'Criar Equipa'}
              </Button>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setTeamBeingViewed(null);
          }}
          title="Detalhes da Equipa"
          size="lg"
        >
          {teamBeingViewed && (
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                {teamBeingViewed.avatar || teamBeingViewed.logo ? (
                  <img
                    src={teamBeingViewed.avatar || teamBeingViewed.logo}
                    alt={teamBeingViewed.name}
                    className="w-16 h-16 rounded-xl object-cover border border-purple-200"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gradient-purple flex items-center justify-center">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-bold text-gray-900">
                      {teamBeingViewed.name}
                    </h3>
                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-700">
                      {teamBeingViewed.members.length} membro
                      {teamBeingViewed.members.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {teamBeingViewed.description && (
                    <p className="text-sm text-gray-600 mt-2">
                      {teamBeingViewed.description}
                    </p>
                  )}
                  {teamBeingViewed.createdBy && (
                    <p className="text-xs text-gray-500 mt-2">
                      Criada por {teamBeingViewed.createdBy.name} ·{' '}
                      {new Date(teamBeingViewed.createdAt).toLocaleDateString('pt-PT')}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-800">
                  Participantes
                </h4>
                <div className="flex items-center gap-2">
                  {isUserMember(teamBeingViewed) ? (
                    <>
                      <div className="px-3 py-1 rounded-lg bg-purple-100 text-purple-700 text-sm font-semibold">
                        Você é membro
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<LogOut className="w-4 h-4" />}
                        onClick={() => handleLeaveTeam(teamBeingViewed._id)}
                        disabled={leaveTeamMutation.isPending}
                      >
                        {leaveTeamMutation.isPending ? 'A sair...' : 'Sair da equipa'}
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="gamified"
                      size="sm"
                      icon={<UserPlus className="w-4 h-4" />}
                      onClick={() => handleJoinTeam(teamBeingViewed._id)}
                      disabled={joinTeamMutation.isPending}
                    >
                      {joinTeamMutation.isPending ? 'A solicitar...' : 'Pedir entrada'}
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-3 border rounded-xl border-gray-200">
                {teamBeingViewed.members.map((member) => (
                  <div
                    key={member._id}
                    className="flex items-center justify-between px-4 py-3 border-b last:border-b-0 border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          member.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            member.name || member.email
                          )}&background=random`
                        }
                        alt={member.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium text-gray-800">{member.name}</p>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Mail className="w-4 h-4" />
                          <span>{member.email}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {teamBeingViewed.createdBy?._id === member._id && (
                        <span className="px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-700 rounded-full">
                          Líder
                        </span>
                      )}
                      {user && member._id === user.id && (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                          Você
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-gray-800">Chat da equipa</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (teamBeingViewed?._id) {
                        queryClient.invalidateQueries({
                          queryKey: ['teamMessages', teamBeingViewed._id],
                        });
                      }
                    }}
                  >
                    Atualizar
                  </Button>
                </div>

                <div className="max-h-72 overflow-y-auto border border-gray-200 rounded-xl bg-gray-50/70">
                  {teamMessagesLoading ? (
                    <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
                      Carregando mensagens...
                    </div>
                  ) : teamMessages && teamMessages.length > 0 ? (
                    <div className="space-y-3 p-4">
                      {teamMessages.map((message) => (
                        <div key={message._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3">
                          <div className="flex items-center gap-3 mb-2">
                            <img
                              src={
                                message.user?.avatar ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  message.user?.name || message.user?.email || 'Utilizador'
                                )}&background=random`
                              }
                              alt={message.user?.name || message.user?.email || 'Utilizador'}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">
                                {message.user?.name || message.user?.email || 'Utilizador'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(message.createdAt).toLocaleString('pt-PT')}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 whitespace-pre-line">
                            {message.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
                      Nenhuma mensagem ainda. Inicie a conversa!
                    </div>
                  )}
                </div>

                {isUserMember(teamBeingViewed) ? (
                  <form onSubmit={handleSendMessage} className="space-y-2">
                    <textarea
                      rows={3}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Escreva uma mensagem para a equipa..."
                      maxLength={2000}
                    />
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        variant="gamified"
                        size="sm"
                        disabled={sendMessageMutation.isPending || !newMessage.trim()}
                      >
                        {sendMessageMutation.isPending ? 'Enviando...' : 'Enviar mensagem'}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <p className="text-xs text-gray-500">
                    Apenas membros da equipa podem participar no chat.
                  </p>
                )}
              </div>
            </div>
          )}
        </Modal>

        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setTeamBeingEdited(null);
          }}
          title="Editar Equipa"
          size="md"
        >
          <form onSubmit={handleUpdateTeam} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Equipa
              </label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                required
                placeholder="Nome da equipa"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                rows={4}
                value={editForm.description}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, description: e.target.value }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Descreva a equipa..."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Avatar URL
                </label>
                <Input
                  value={editForm.avatar}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, avatar: e.target.value }))
                  }
                  type="url"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Logo URL
                </label>
                <Input
                  value={editForm.logo}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, logo: e.target.value }))
                  }
                  type="url"
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowEditModal(false);
                  setTeamBeingEdited(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="gamified"
                disabled={updateTeamMutation.isPending}
              >
                {updateTeamMutation.isPending ? 'Guardando...' : 'Guardar alterações'}
              </Button>
            </div>
          </form>
        </Modal>
      </Container>
    </Layout>
  );
}