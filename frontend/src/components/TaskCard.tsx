import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskWithRelations, User } from '../types';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale/pt';
import { Trash2, Calendar, User as UserIcon, Tag as TagIcon, AlertCircle } from 'lucide-react';

interface TaskCardProps {
  task: TaskWithRelations;
  onClick: () => void;
  onDelete?: (id: string) => void;
  isAdmin: boolean;
  users?: User[];
}

const TaskCard = ({ task, onClick, onDelete, isAdmin, users = [] }: TaskCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };

  const priorityLabels = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
  };

  const isOverdue =
    task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-gray-900 dark:text-white text-sm flex-1">{task.title}</h4>
        {isAdmin && onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {task.description && (
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center gap-2 mb-3">
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority]}`}
        >
          {priorityLabels[task.priority]}
        </span>
      </div>

      {task.deadline && (
        <div
          className={`flex items-center gap-1 text-xs mb-2 ${
            isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'
          }`}
        >
          <Calendar className="w-3 h-3" />
          <span>
            {format(new Date(task.deadline), "d 'de' MMM", { locale: pt })}
          </span>
        </div>
      )}

      {(task.assigned_users && task.assigned_users.length > 0) && (
        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mt-2">
          <UserIcon className="w-3 h-3 flex-shrink-0" />
          <div className="flex flex-wrap gap-1">
            {task.assigned_users.slice(0, 3).map((user, idx) => (
              <span key={user.id} className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                {user.name}
              </span>
            ))}
            {task.assigned_users.length > 3 && (
              <span className="text-gray-500">+{task.assigned_users.length - 3}</span>
            )}
          </div>
        </div>
      )}
      {/* Fallback para compatibilidade com assigned_user único */}
      {(!task.assigned_users || task.assigned_users.length === 0) && task.assigned_user && (
        <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 mt-2">
          <UserIcon className="w-3 h-3" />
          <span>{task.assigned_user.name}</span>
        </div>
      )}

      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {task.tags.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
            >
              {tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="px-2 py-0.5 text-gray-500 text-xs">+{task.tags.length - 3}</span>
          )}
        </div>
      )}

      {task.comments && task.comments.length > 0 && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {task.comments.length} comentário{task.comments.length !== 1 ? 's' : ''}
        </div>
      )}

      {isOverdue && (
        <div className="mt-2 flex items-center gap-1 text-xs text-red-600 font-medium">
          <AlertCircle className="w-3 h-3" />
          <span>Atrasada</span>
        </div>
      )}
    </div>
  );
};

export default TaskCard;

