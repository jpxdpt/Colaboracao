import { useState, useEffect } from 'react';
import { TaskWithRelations, User, Tag, ActivityLog } from '../types';
import { taskService } from '../services/taskService';
import { commentService } from '../services/commentService';
import { tagService } from '../services/tagService';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale/pt';
import {
  X,
  Save,
  Calendar,
  User as UserIcon,
  MessageSquare,
  Send,
  Trash2,
  Tag as TagIcon,
  History,
  CheckSquare,
  Plus,
} from 'lucide-react';

interface TaskModalProps {
  task: TaskWithRelations | null;
  users?: User[];
  onClose: () => void;
  onSave: () => void;
  isAdmin: boolean;
}

const TaskModal = ({ task, users = [], onClose, onSave, isAdmin }: TaskModalProps) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [deadline, setDeadline] = useState('');
  const [startDate, setStartDate] = useState('');
  const [status, setStatus] = useState<'pending' | 'in_progress' | 'completed'>('pending');
  const [tags, setTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'history' | 'subtasks'>(
    'details'
  );
  const [subtasks, setSubtasks] = useState<TaskWithRelations[]>([]);

  useEffect(() => {
    loadAvailableTags();
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setAssignedTo(Array.isArray(task.assigned_to) ? task.assigned_to : (task.assigned_to ? [task.assigned_to] : []));
      setPriority(task.priority);
      setDeadline(task.deadline ? format(new Date(task.deadline), 'yyyy-MM-dd') : '');
      setStartDate(task.start_date ? format(new Date(task.start_date), 'yyyy-MM-dd') : '');
      setStatus(task.status);
      setTags(task.tags || []);
      setActivityLogs(task.activity_logs || []);
      setSubtasks(task.subtasks || []);
      loadComments();
    } else {
      setTitle('');
      setDescription('');
      setAssignedTo([]);
      setPriority('medium');
      setDeadline('');
      setStartDate('');
      setStatus('pending');
      setTags([]);
      setActivityLogs([]);
      setSubtasks([]);
    }
  }, [task]);

  const loadAvailableTags = async () => {
    try {
      const tagsData = await tagService.getTags();
      setAvailableTags(tagsData);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const loadComments = async () => {
    if (!task) return;
    try {
      const commentsData = await commentService.getComments(task.id);
      setComments(commentsData);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      if (task) {
        await taskService.updateTask(task.id, {
          title,
          description,
          assigned_to: assignedTo.length > 0 ? assignedTo : undefined,
          priority,
          deadline: deadline || undefined,
          start_date: startDate || undefined,
          status: isAdmin ? status : undefined,
          tags,
        });
      } else {
        await taskService.createTask({
          title,
          description,
          assigned_to: assignedTo.length > 0 ? assignedTo : undefined,
          priority,
          deadline: deadline || undefined,
          start_date: startDate || undefined,
          tags,
        });
      }
      onSave();
    } catch (error) {
      console.error('Error saving task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !task) return;

    setCommentLoading(true);
    try {
      await commentService.createComment(task.id, newComment);
      setNewComment('');
      loadComments();
      // Recarregar tarefa para atualizar histórico
      if (task) {
        const updatedTask = await taskService.getTask(task.id);
        setActivityLogs(updatedTask.activity_logs || []);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteComment = async (id: string) => {
    try {
      await commentService.deleteComment(id);
      loadComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleAddTag = async () => {
    if (!newTagName.trim()) return;
    const tagName = newTagName.trim().toLowerCase();

    if (tags.includes(tagName)) {
      setNewTagName('');
      return;
    }

    // Verificar se tag existe, se não, criar
    let tag = availableTags.find((t) => t.name.toLowerCase() === tagName);
    if (!tag && isAdmin) {
      try {
        tag = await tagService.createTag({ name: tagName });
        setAvailableTags([...availableTags, tag]);
      } catch (error) {
        console.error('Error creating tag:', error);
      }
    }

    if (tag) {
      setTags([...tags, tag.name]);
      setNewTagName('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleCreateSubtask = async () => {
    if (!task) return;
    const subtaskTitle = prompt('Título da subtarefa:');
    if (!subtaskTitle) return;

    try {
      await taskService.createTask({
        title: subtaskTitle,
        parent_task_id: task.id,
        priority: task.priority,
      });
      const updatedTask = await taskService.getTask(task.id);
      setSubtasks(updatedTask.subtasks || []);
    } catch (error) {
      console.error('Error creating subtask:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {task ? 'Editar Tarefa' : 'Nova Tarefa'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        {task && (
          <div className="border-b px-6 flex gap-4">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-3 px-2 border-b-2 transition-colors ${
                activeTab === 'details'
                  ? 'border-primary-600 text-primary-600 font-medium'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Detalhes
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`py-3 px-2 border-b-2 transition-colors relative ${
                activeTab === 'comments'
                  ? 'border-primary-600 text-primary-600 font-medium'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Comentários
              {comments.length > 0 && (
                <span className="ml-2 bg-primary-100 text-primary-600 text-xs px-2 py-0.5 rounded-full">
                  {comments.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-3 px-2 border-b-2 transition-colors ${
                activeTab === 'history'
                  ? 'border-primary-600 text-primary-600 font-medium'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <History className="w-4 h-4 inline mr-1" />
              Histórico
            </button>
            <button
              onClick={() => setActiveTab('subtasks')}
              className={`py-3 px-2 border-b-2 transition-colors relative ${
                activeTab === 'subtasks'
                  ? 'border-primary-600 text-primary-600 font-medium'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <CheckSquare className="w-4 h-4 inline mr-1" />
              Subtarefas
              {subtasks.length > 0 && (
                <span className="ml-2 bg-primary-100 text-primary-600 text-xs px-2 py-0.5 rounded-full">
                  {subtasks.length}
                </span>
              )}
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'details' && (
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Título */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input"
                  required
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input min-h-[100px]"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Atribuído a */}
                {isAdmin && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Atribuído a
                    </label>
                    <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 max-h-48 overflow-y-auto bg-white dark:bg-gray-800">
                      {users.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum utilizador disponível</p>
                      ) : (
                        <div className="space-y-2">
                          {users.map((u) => (
                            <label
                              key={u.id}
                              className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={assignedTo.includes(u.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setAssignedTo([...assignedTo, u.id]);
                                  } else {
                                    setAssignedTo(assignedTo.filter((id) => id !== u.id));
                                  }
                                }}
                                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                              />
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {u.name}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{u.email}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                    {assignedTo.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="text-xs text-gray-600 dark:text-gray-400">Atribuído a:</span>
                        {assignedTo.map((userId) => {
                          const user = users.find((u) => u.id === userId);
                          return user ? (
                            <span
                              key={userId}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-full text-xs"
                            >
                              {user.name}
                              <button
                                type="button"
                                onClick={() => setAssignedTo(assignedTo.filter((id) => id !== userId))}
                                className="hover:text-blue-900 dark:hover:text-blue-100 font-bold"
                                title="Remover"
                              >
                                ×
                              </button>
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Prioridade */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prioridade
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                    className="input"
                    disabled={!isAdmin}
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                  </select>
                </div>

                {/* Data de Início */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de Início
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="input"
                    disabled={!isAdmin}
                  />
                </div>

                {/* Prazo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prazo
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="input"
                    disabled={!isAdmin}
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value as 'pending' | 'in_progress' | 'completed')
                    }
                    className="input"
                    disabled={!isAdmin && task?.assigned_to !== user?.id}
                  >
                    <option value="pending">Pendente</option>
                    <option value="in_progress">Em Progresso</option>
                    <option value="completed">Concluída</option>
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Etiquetas
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      <TagIcon className="w-3 h-3" />
                      {tag}
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-blue-900"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                {isAdmin && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      placeholder="Adicionar etiqueta..."
                      className="input flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="btn btn-secondary flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar
                    </button>
                  </div>
                )}
              </div>

              {/* Botões */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-secondary"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex items-center gap-2"
                  disabled={loading}
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'A guardar...' : 'Guardar'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'comments' && task && (
            <div className="p-6">
              <div className="space-y-4 mb-4 max-h-[400px] overflow-y-auto">
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900">
                          {comment.user_name || 'Utilizador'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(comment.created_at), "d 'de' MMM 'às' HH:mm", {
                            locale: pt,
                          })}
                        </div>
                      </div>
                      {(isAdmin || comment.user_id === user?.id) && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Eliminar comentário"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-700">{comment.content}</p>
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-8">
                    Nenhum comentário ainda
                  </p>
                )}
              </div>

              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Adicionar comentário..."
                  className="input flex-1"
                />
                <button
                  type="submit"
                  disabled={commentLoading || !newComment.trim()}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {activeTab === 'history' && task && (
            <div className="p-6">
              <div className="space-y-3">
                {activityLogs.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    Nenhum histórico de alterações
                  </p>
                ) : (
                  activityLogs.map((log) => (
                    <div key={log.id} className="flex gap-3 pb-3 border-b last:border-0">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <History className="w-4 h-4 text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-900">
                          <span className="font-medium">{log.user_name || 'Utilizador'}</span>
                          {' '}
                          {log.action === 'created' && 'criou a tarefa'}
                          {log.action === 'updated' && `atualizou ${log.field}`}
                          {log.action === 'status_changed' && 'alterou o estado'}
                          {log.action === 'assigned' && 'atribuiu a tarefa'}
                          {log.action === 'comment_added' && 'adicionou um comentário'}
                        </div>
                        {log.old_value !== undefined && log.new_value !== undefined && (
                          <div className="text-xs text-gray-500 mt-1">
                            {String(log.old_value)} → {String(log.new_value)}
                          </div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">
                          {format(new Date(log.created_at), "d 'de' MMM 'às' HH:mm", {
                            locale: pt,
                          })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'subtasks' && task && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Subtarefas</h3>
                {isAdmin && (
                  <button
                    onClick={handleCreateSubtask}
                    className="btn btn-primary flex items-center gap-2 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Nova Subtarefa
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {subtasks.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    Nenhuma subtarefa criada
                  </p>
                ) : (
                  subtasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <CheckSquare
                          className={`w-4 h-4 ${
                            subtask.status === 'completed'
                              ? 'text-green-600'
                              : 'text-gray-400'
                          }`}
                        />
                        <span
                          className={
                            subtask.status === 'completed' ? 'line-through text-gray-500' : ''
                          }
                        >
                          {subtask.title}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          subtask.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : subtask.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {subtask.status === 'completed'
                          ? 'Concluída'
                          : subtask.status === 'in_progress'
                          ? 'Em Progresso'
                          : 'Pendente'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
