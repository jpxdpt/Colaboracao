import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { ChevronLeft, ChevronRight, Flag } from 'lucide-react';

interface Task {
  _id: string;
  title: string;
  description?: string;
  status: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  createdAt: string;
  points?: number;
}

interface CalendarViewProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

export default function CalendarView({ tasks, onTaskClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const firstDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const weeks = useMemo(() => {
    const weeksArray: Date[][] = [];
    let currentWeek: Date[] = [];

    // Preencher dias do mês anterior
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      currentWeek.push(date);
    }

    // Preencher dias do mês atual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      currentWeek.push(date);

      if (currentWeek.length === 7) {
        weeksArray.push(currentWeek);
        currentWeek = [];
      }
    }

    // Preencher dias do próximo mês
    if (currentWeek.length > 0) {
      const daysNeeded = 7 - currentWeek.length;
      for (let day = 1; day <= daysNeeded; day++) {
        const date = new Date(year, month + 1, day);
        currentWeek.push(date);
      }
      weeksArray.push(currentWeek);
    }

    return weeksArray;
  }, [year, month, firstDayOfWeek, daysInMonth]);

  const getTasksForDate = (date: Date) => {
    return tasks.filter((task) => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return (
        taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500 border-red-600';
      case 'medium':
        return 'bg-yellow-500 border-yellow-600';
      default:
        return 'bg-blue-500 border-blue-600';
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === month;
  };

  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button
              variant="secondary"
              onClick={goToPreviousMonth}
              icon={<ChevronLeft className="w-4 h-4" />}
            />
            <h2 className="text-2xl font-bold text-gray-900">
              {monthNames[month]} {year}
            </h2>
            <Button
              variant="secondary"
              onClick={goToNextMonth}
              icon={<ChevronRight className="w-4 h-4" />}
            />
          </div>
          <Button variant="secondary" onClick={goToToday}>
            Hoje
          </Button>
        </div>

        {/* Week Days Header */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {weeks.map((week, weekIndex) =>
            week.map((date, dayIndex) => {
              const dayTasks = getTasksForDate(date);
              const isCurrentMonthDay = isCurrentMonth(date);
              const isTodayDate = isToday(date);

              return (
                <motion.div
                  key={`${weekIndex}-${dayIndex}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: (weekIndex * 7 + dayIndex) * 0.01 }}
                  className={`min-h-[100px] border rounded-lg p-2 ${
                    isCurrentMonthDay
                      ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                      : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 opacity-50'
                  } ${isTodayDate ? 'ring-2 ring-purple-500' : ''}`}
                >
                  <div
                    className={`text-sm font-semibold mb-2 ${
                      isTodayDate
                        ? 'text-purple-600'
                        : isCurrentMonthDay
                        ? 'text-gray-900 dark:text-gray-100'
                        : 'text-gray-400'
                    }`}
                  >
                    {date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayTasks.slice(0, 3).map((task) => (
                      <div
                        key={task._id}
                        onClick={() => onTaskClick?.(task)}
                        className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity ${getPriorityColor(
                          task.priority
                        )} text-white truncate`}
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
                </motion.div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}

