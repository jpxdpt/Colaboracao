import { useMemo } from 'react';
import { TaskWithRelations } from '../types';
import { format, startOfWeek, eachDayOfInterval, isSameDay, addDays } from 'date-fns';
import { pt } from 'date-fns/locale/pt';

interface GanttChartProps {
  tasks: TaskWithRelations[];
  onTaskClick?: (task: TaskWithRelations) => void;
}

const GanttChart = ({ tasks, onTaskClick }: GanttChartProps) => {
  // Calcular período (4 semanas a partir de hoje)
  const today = new Date();
  const startDate = startOfWeek(today, { weekStartsOn: 1 }); // Segunda-feira
  const endDate = addDays(startDate, 28); // 4 semanas
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Filtrar tarefas com datas
  const tasksWithDates = useMemo(() => {
    return tasks.filter((task) => {
      if (!task.start_date && !task.deadline) return false;
      // Verificar se a tarefa está dentro do range visível
      const taskStart = task.start_date ? new Date(task.start_date) : null;
      const taskEnd = task.deadline ? new Date(task.deadline) : null;
      // Tarefa está visível se começa antes do fim do range ou termina depois do início
      return (taskStart && taskStart <= endDate) || (taskEnd && taskEnd >= startDate);
    });
  }, [tasks, startDate, endDate]);

  // Calcular posição e largura de cada tarefa
  const getTaskPosition = (task: TaskWithRelations) => {
    if (!task.start_date && !task.deadline) return null;

    const taskStart = task.start_date ? new Date(task.start_date) : (task.deadline ? new Date(task.deadline) : startDate);
    const taskEnd = task.deadline ? new Date(task.deadline) : (task.start_date ? addDays(new Date(task.start_date), 1) : addDays(startDate, 1));

    // Garantir que as datas estão dentro do range visível
    const actualStart = taskStart < startDate ? startDate : (taskStart > endDate ? endDate : taskStart);
    const actualEnd = taskEnd > endDate ? endDate : (taskEnd < startDate ? startDate : taskEnd);

    const startIndex = days.findIndex((day) => day >= actualStart);
    const endIndex = days.findIndex((day) => day >= actualEnd);

    if (startIndex === -1) {
      // Tarefa está depois do range
      return null;
    }

    const finalEndIndex = endIndex === -1 ? days.length - 1 : endIndex;
    const left = (startIndex / days.length) * 100;
    const width = Math.max(2, ((finalEndIndex - startIndex + 1) / days.length) * 100);

    return { left, width };
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-600';
      case 'in_progress':
        return 'bg-blue-600';
      case 'pending':
        return 'bg-gray-400';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto">
      {/* Cabeçalho com datas */}
      <div className="sticky top-0 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-10">
        <div className="flex">
          <div className="w-64 flex-shrink-0 p-4 border-r border-gray-200 dark:border-gray-700 font-semibold text-gray-900 dark:text-white">
            Tarefa
          </div>
          <div className="flex-1 flex">
            {days.map((day, index) => {
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              const isToday = isSameDay(day, today);
              return (
                <div
                  key={index}
                  className={`flex-1 p-2 text-center text-xs border-r border-gray-200 dark:border-gray-700 ${
                    isWeekend ? 'bg-gray-100 dark:bg-gray-800' : 'bg-white dark:bg-gray-900'
                  } ${isToday ? 'ring-2 ring-primary-500' : ''}`}
                  style={{ minWidth: '80px' }}
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    {format(day, 'd', { locale: pt })}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">
                    {format(day, 'EEE', { locale: pt })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Linhas de tarefas */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {tasksWithDates.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            Nenhuma tarefa com datas para exibir
          </div>
        ) : (
          tasksWithDates.map((task) => {
            const position = getTaskPosition(task);
            if (!position) return null;

            return (
              <div
                key={task.id}
                className="flex hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {/* Nome da tarefa */}
                <div className="w-64 flex-shrink-0 p-4 border-r border-gray-200 dark:border-gray-700">
                  <div
                    className="font-medium text-gray-900 dark:text-white cursor-pointer hover:text-primary-600 dark:hover:text-primary-400"
                    onClick={() => onTaskClick?.(task)}
                  >
                    {task.title}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {task.assigned_users?.map((u) => u.name).join(', ') || 'Não atribuído'}
                  </div>
                </div>

                {/* Barra de Gantt */}
                <div className="flex-1 relative p-2" style={{ minHeight: '60px' }}>
                  <div
                    className={`absolute h-8 rounded ${getStatusColor(task.status)} ${getPriorityColor(
                      task.priority
                    )} opacity-80 cursor-pointer hover:opacity-100 transition-opacity flex items-center px-2 text-white text-xs font-medium`}
                    style={{
                      left: `${position.left}%`,
                      width: `${position.width}%`,
                      minWidth: '20px',
                    }}
                    onClick={() => onTaskClick?.(task)}
                    title={`${task.title} - ${format(
                      task.start_date ? new Date(task.start_date) : new Date(),
                      'd MMM',
                      { locale: pt }
                    )} a ${format(task.deadline ? new Date(task.deadline) : new Date(), 'd MMM', {
                      locale: pt,
                    })}`}
                  >
                    <span className="truncate">{task.title}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default GanttChart;

