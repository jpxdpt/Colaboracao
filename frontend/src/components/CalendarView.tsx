import { useState } from 'react';
import { TaskWithRelations } from '../types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { pt } from 'date-fns/locale/pt';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarViewProps {
  tasks: TaskWithRelations[];
  onTaskClick: (task: TaskWithRelations) => void;
}

const CalendarView = ({ tasks, onTaskClick }: CalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getTasksForDate = (date: Date) => {
    return tasks.filter((task) => {
      if (!task.deadline) return false;
      const taskDate = new Date(task.deadline);
      return (
        taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Adicionar dias do início do mês para completar a primeira semana
  const firstDayOfWeek = monthStart.getDay();
  const emptyDays = Array.from({ length: firstDayOfWeek }, (_, i) => i);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={previousMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-gray-900">
          {format(currentDate, 'MMMM yyyy', { locale: pt })}
        </h2>
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
            {day}
          </div>
        ))}

        {emptyDays.map((_, idx) => (
          <div key={`empty-${idx}`} className="h-24" />
        ))}

        {days.map((day) => {
          const dayTasks = getTasksForDate(day);
          const isCurrentDay = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={`min-h-24 border rounded-lg p-2 ${
                isSameMonth(day, currentDate) ? 'border-gray-200' : 'border-gray-100'
              } ${isCurrentDay ? 'bg-primary-50 border-primary-300' : ''}`}
            >
              <div
                className={`text-sm font-medium mb-1 ${
                  isCurrentDay ? 'text-primary-600' : 'text-gray-700'
                }`}
              >
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {dayTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onTaskClick(task)}
                    className="text-xs p-1 bg-blue-100 text-blue-700 rounded cursor-pointer hover:bg-blue-200 truncate"
                    title={task.title}
                  >
                    {task.title}
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{dayTasks.length - 3} mais
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;

