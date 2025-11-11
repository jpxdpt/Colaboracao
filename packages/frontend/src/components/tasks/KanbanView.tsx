import { motion } from 'framer-motion';
import { useState } from 'react';
import { TaskStatus } from '@shared/constants/enums';
import Card from '../ui/Card';
import { CheckCircle2, Circle, Clock, Flag, ChevronDown, ChevronRight } from 'lucide-react';

interface Task {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  points?: number;
  subtasks?: Task[];
  parentTask?: {
    _id: string;
    title: string;
    status: TaskStatus;
  };
}

interface KanbanViewProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
}

const statusConfig: Record<TaskStatus, {
  label: string;
  icon: React.ElementType;
  color: string;
}> = {
  [TaskStatus.PENDING]: {
    label: 'Pendente',
    icon: Circle,
    color: 'bg-gray-100 border-gray-300 dark:bg-gray-800/80 dark:border-gray-700',
  },
  [TaskStatus.IN_PROGRESS]: {
    label: 'Em Progresso',
    icon: Clock,
    color: 'bg-blue-100 border-blue-300 dark:bg-blue-900/40 dark:border-blue-600/60',
  },
  [TaskStatus.COMPLETED]: {
    label: 'Concluída',
    icon: CheckCircle2,
    color: 'bg-green-100 border-green-300 dark:bg-green-900/40 dark:border-green-600/60',
  },
  [TaskStatus.VALIDATED]: {
    label: 'Validada',
    icon: CheckCircle2,
    color: 'bg-purple-100 border-purple-300 dark:bg-purple-900/40 dark:border-purple-600/60',
  },
};

export default function KanbanView({ tasks, onTaskClick, onStatusChange }: KanbanViewProps) {
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  // Incluir subtarefas na lista de tarefas para o Kanban
  const getAllTasksForKanban = () => {
    const allTasks: Task[] = [];
    tasks.forEach((task) => {
      // Adicionar tarefa principal
      allTasks.push(task);
      // Adicionar subtarefas se existirem
      if (task.subtasks && task.subtasks.length > 0 && expandedTasks.has(task._id)) {
        task.subtasks.forEach((subtask) => {
          allTasks.push(subtask);
        });
      }
    });
    return allTasks;
  };

  const getTasksByStatus = (status: TaskStatus) => {
    const allTasks = getAllTasksForKanban();
    return allTasks.filter((task) => task.status === status);
  };

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const findTaskById = (taskId: string): Task | undefined => {
    for (const task of tasks) {
      if (task._id === taskId) {
        return task;
      }
      if (task.subtasks) {
        const subtask = task.subtasks.find((st) => st._id === taskId);
        if (subtask) {
          return subtask;
        }
      }
    }
    return undefined;
  };

const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
      return 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-500/60';
      case 'medium':
      return 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-200 dark:border-yellow-500/60';
      default:
      return 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-500/60';
    }
  };

  const handleDragStart = (taskId: string) => {
    setDraggedTask(taskId);
  };

  const handleDragEnd = (taskId: string, currentStatus: TaskStatus) => {
    if (dragOverColumn && dragOverColumn !== currentStatus && onStatusChange) {
      onStatusChange(taskId, dragOverColumn);
    }
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (status: TaskStatus, isOver: boolean) => {
    if (isOver) {
      setDragOverColumn(status);
    } else {
      setDragOverColumn(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full overflow-x-auto pb-4">
      {(Object.values(TaskStatus) as TaskStatus[]).map((typedStatus) => {
        const statusTasks = getTasksByStatus(typedStatus);
        const config = statusConfig[typedStatus];
        
        // Pular se não houver configuração para este status
        if (!config) {
          return null;
        }
        
        const Icon = config.icon;

        return (
          <motion.div
            key={typedStatus}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col min-w-[300px]"
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleDragOver(typedStatus, true);
              if (e.dataTransfer) {
                e.dataTransfer.dropEffect = 'move';
              }
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              // Só remover o highlight se realmente saiu da coluna
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX;
              const y = e.clientY;
              if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
                handleDragOver(typedStatus, false);
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const taskId = e.dataTransfer.getData('text/plain');
              if (taskId && onStatusChange) {
                const task = findTaskById(taskId);
                if (task && task.status !== typedStatus) {
                  onStatusChange(taskId, typedStatus);
                }
              }
              handleDragOver(typedStatus, false);
            }}
          >
            <div
              className={`${config.color} rounded-lg p-4 mb-4 transition-all ${
                dragOverColumn === typedStatus ? 'ring-2 ring-purple-500 ring-offset-2' : ''
              }`}
              role="region"
              aria-label={`Coluna ${config.label} com ${statusTasks.length} tarefas`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-5 h-5 text-gray-700 dark:text-gray-200" aria-hidden="true" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{config.label}</h3>
                <span className="ml-auto bg-white/50 dark:bg-gray-900/40 px-2 py-1 rounded-full text-sm font-medium text-gray-800 dark:text-gray-100" aria-label={`${statusTasks.length} tarefas`}>
                  {statusTasks.length}
                </span>
              </div>
            </div>

            <div
              className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-300px)] min-h-[100px]"
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDragOver(typedStatus, true);
                if (e.dataTransfer) {
                  e.dataTransfer.dropEffect = 'move';
                }
              }}
              onDragLeave={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX;
                const y = e.clientY;
                if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
                  handleDragOver(typedStatus, false);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const taskId = e.dataTransfer.getData('text/plain');
                if (taskId && onStatusChange) {
                const task = findTaskById(taskId);
                  if (task && task.status !== typedStatus) {
                    onStatusChange(taskId, typedStatus);
                  }
                }
                handleDragOver(typedStatus, false);
              }}
            >
              {statusTasks.length === 0 ? (
                <div
                  className={`text-center py-8 text-gray-400 dark:text-gray-500 text-sm rounded-lg border-2 border-dashed transition-all ${
                    dragOverColumn === typedStatus
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {dragOverColumn === typedStatus ? 'Solte aqui' : 'Nenhuma tarefa'}
                </div>
              ) : (
                statusTasks.map((task, index) => {
                  // Verificar se é uma subtarefa
                  const isSubtask = !!task.parentTask;
                  // Encontrar a tarefa principal se for subtarefa
                  const parentTask = isSubtask
                    ? tasks.find((t) => {
                        const parentRef = task.parentTask;
                        if (!parentRef) return false;
                        if (typeof parentRef === 'string') {
                          return t._id === parentRef;
                        }
                        return t._id === parentRef._id;
                      })
                    : null;

                  return (
                    <motion.div
                      key={task._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{
                        opacity: draggedTask === task._id ? 0.5 : 1,
                        x: 0,
                        scale: draggedTask === task._id ? 0.95 : 1,
                      }}
                      transition={{ delay: index * 0.05 }}
                      draggable
                      drag
                      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                      dragElastic={0.2}
                      onDragStart={(e) => {
                        handleDragStart(task._id);
                        if (e instanceof DragEvent && e.dataTransfer) {
                          e.dataTransfer.effectAllowed = 'move';
                          e.dataTransfer.setData('text/plain', task._id);
                        }
                        if (e.currentTarget instanceof HTMLElement) {
                          e.currentTarget.style.opacity = '0.5';
                        }
                      }}
                      onDragEnd={(e) => {
                        handleDragEnd(task._id, task.status);
                        if (e.currentTarget instanceof HTMLElement) {
                          e.currentTarget.style.opacity = '1';
                        }
                      }}
                      className={`touch-none ${draggedTask === task._id ? 'opacity-50' : ''} ${
                        isSubtask ? 'ml-4 border-l-2 border-purple-300 dark:border-purple-600 pl-2' : ''
                      }`}
                    >
                      <Card
                        variant="interactive"
                        onClick={() => {
                          if (!draggedTask) {
                            onTaskClick?.(task);
                          }
                        }}
                        className={`cursor-grab active:cursor-grabbing hover:shadow-lg transition-shadow ${
                          draggedTask === task._id ? 'shadow-2xl' : ''
                        } ${isSubtask ? 'bg-gray-50 dark:bg-gray-800/50' : ''}`}
                        role="button"
                        tabIndex={0}
                        aria-label={`Tarefa: ${task.title}. Status: ${config.label}. Prioridade: ${task.priority}`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onTaskClick?.(task);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1">
                            {!isSubtask && task.subtasks && task.subtasks.length > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleTaskExpansion(task._id);
                                }}
                                className="hover:scale-110 transition-transform"
                              >
                                {expandedTasks.has(task._id) ? (
                                  <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                )}
                              </button>
                            )}
                            {isSubtask && (
                              <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                                ↳
                              </span>
                            )}
                            <div className="flex-1">
                              <h4
                                className={`font-semibold line-clamp-2 ${
                                  isSubtask
                                    ? 'text-sm text-gray-700 dark:text-gray-300'
                                    : 'text-gray-900 dark:text-white'
                                }`}
                              >
                                {task.title}
                              </h4>
                              {isSubtask && parentTask && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  de: {parentTask.title}
                                </p>
                              )}
                            </div>
                          </div>
                          <span
                            className={`px-2 py-1 rounded-lg text-xs font-semibold border ml-2 ${getPriorityColor(
                              task.priority
                            )}`}
                          >
                            {task.priority === 'high' ? (
                              <Flag className="w-3 h-3 inline" />
                            ) : (
                              task.priority
                            )}
                          </span>
                        </div>

                        {task.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                            {task.description}
                          </p>
                        )}

                        {/* Mostrar contador de subtarefas se for tarefa principal */}
                        {!isSubtask && task.subtasks && task.subtasks.length > 0 && (
                          <div className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                            {task.subtasks.filter((st) => st.status === typedStatus).length}/
                            {task.subtasks.length} subtarefas nesta coluna
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          {task.points && (
                            <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-semibold text-sm">
                              <span>+{task.points}</span>
                              <span className="text-xs">pts</span>
                            </div>
                          )}
                          {task.dueDate && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(task.dueDate).toLocaleDateString('pt-PT')}
                            </span>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

