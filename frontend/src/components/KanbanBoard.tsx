import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { TaskWithRelations, User } from '../types';
import TaskCard from './TaskCard';
import { taskService } from '../services/taskService';

interface KanbanBoardProps {
  tasks: TaskWithRelations[];
  onTaskClick: (task: TaskWithRelations) => void;
  onTaskUpdate: () => void;
  onTaskDelete?: (id: string) => void;
  isAdmin: boolean;
  users?: User[];
}

const KanbanBoard = ({
  tasks,
  onTaskClick,
  onTaskUpdate,
  onTaskDelete,
  isAdmin,
  users = [],
}: KanbanBoardProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedTask, setDraggedTask] = useState<TaskWithRelations | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const columns = [
    { id: 'pending', title: 'Pendentes', color: 'bg-yellow-50 border-yellow-200' },
    { id: 'in_progress', title: 'Em Progresso', color: 'bg-blue-50 border-blue-200' },
    { id: 'completed', title: 'Concluídas', color: 'bg-green-50 border-green-200' },
  ];

  // Componente para coluna droppable
  const DroppableColumn = ({ column, children }: { column: typeof columns[0]; children: React.ReactNode }) => {
    const { setNodeRef } = useDroppable({
      id: column.id,
    });

    return (
      <div
        ref={setNodeRef}
        className={`rounded-lg border-2 ${column.color} dark:border-gray-700 dark:bg-gray-800/50 p-4 min-h-[400px]`}
      >
        {children}
      </div>
    );
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter((task) => task.status === status);
  };

  const handleDragStart = (event: any) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    setActiveId(active.id);
    setDraggedTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setDraggedTask(null);

    if (!over) return;

    const task = tasks.find((t) => t.id === active.id);
    if (!task) return;

    // Verificar se está a arrastar para uma coluna (status) ou para outra tarefa
    const validStatuses = ['pending', 'in_progress', 'completed'];
    const newStatus = validStatuses.includes(over.id as string)
      ? (over.id as 'pending' | 'in_progress' | 'completed')
      : null;

    // Se não for uma coluna válida, não fazer nada
    if (!newStatus) return;

    // Se o status não mudou, não fazer nada
    if (task.status === newStatus) return;

    try {
      await taskService.updateTask(task.id, { status: newStatus });
      onTaskUpdate();
    } catch (error) {
      console.error('Error updating task status:', error);
      // Mostrar erro ao utilizador
      alert('Erro ao atualizar o estado da tarefa. Por favor, tente novamente.');
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((column) => {
          const columnTasks = getTasksByStatus(column.id);
          const taskIds = columnTasks.map((t) => t.id);

          return (
            <DroppableColumn key={column.id} column={column}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">{column.title}</h3>
                <span className="bg-white dark:bg-gray-700 px-2 py-1 rounded-full text-sm font-medium text-gray-700 dark:text-gray-200">
                  {columnTasks.length}
                </span>
              </div>

              <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onClick={() => onTaskClick(task)}
                      onDelete={onTaskDelete}
                      isAdmin={isAdmin}
                      users={users}
                    />
                  ))}
                  {columnTasks.length === 0 && (
                    <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                      Nenhuma tarefa
                    </div>
                  )}
                </div>
              </SortableContext>
            </DroppableColumn>
          );
        })}
      </div>

      <DragOverlay>
        {draggedTask ? (
          <div className="opacity-90">
            <TaskCard
              task={draggedTask}
              onClick={() => {}}
              isAdmin={isAdmin}
              users={users}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default KanbanBoard;

