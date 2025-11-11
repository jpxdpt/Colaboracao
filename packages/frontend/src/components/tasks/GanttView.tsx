import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';
import Card from '../ui/Card';
import { TaskStatus } from '@shared';

interface Task {
  _id: string;
  title: string;
  description?: string;
  status: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  createdAt: string;
  points?: number;
  subtasks?: Task[];
}

interface GanttViewProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

type TimelineRow = {
  task: Task;
  level: number;
  childCount?: number;
};

const DAY_WIDTH = 72;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

const PRIORITY_STYLES: Record<
  string,
  { label: string; dotClass: string; barClass: string; badgeClass: string }
> = {
  high: {
    label: 'Alta',
    dotClass: 'bg-red-500',
    barClass: 'from-red-500 via-red-400 to-red-500',
    badgeClass: 'text-red-600 dark:text-red-300',
  },
  medium: {
    label: 'Média',
    dotClass: 'bg-amber-500',
    barClass: 'from-amber-500 via-amber-400 to-amber-500',
    badgeClass: 'text-amber-600 dark:text-amber-200',
  },
  low: {
    label: 'Baixa',
    dotClass: 'bg-blue-500',
    barClass: 'from-blue-500 via-blue-400 to-blue-500',
    badgeClass: 'text-blue-600 dark:text-blue-300',
  },
  default: {
    label: 'Normal',
    dotClass: 'bg-slate-400',
    barClass: 'from-slate-500 via-slate-400 to-slate-500',
    badgeClass: 'text-slate-600 dark:text-slate-300',
  },
};

const STATUS_META: Record<
  string,
  { label: string; className: string }
> = {
  [TaskStatus.PENDING]: {
    label: 'Pendente',
    className:
      'bg-gray-100 text-gray-700 dark:bg-gray-800/60 dark:text-gray-300 border border-gray-200 dark:border-gray-700',
  },
  [TaskStatus.IN_PROGRESS]: {
    label: 'Em Progresso',
    className:
      'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200 border border-blue-200 dark:border-blue-500/40',
  },
  [TaskStatus.COMPLETED]: {
    label: 'Concluída',
    className:
      'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-200 border border-green-200 dark:border-green-500/40',
  },
  [TaskStatus.VALIDATED]: {
    label: 'Validada',
    className:
      'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-200 border border-purple-200 dark:border-purple-500/40',
  },
};

const formatDate = (date: Date) =>
  date.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });

const getPriorityMeta = (priority: Task['priority']) =>
  PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.default;

export default function GanttView({ tasks, onTaskClick }: GanttViewProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const flattenedTasks = useMemo(() => {
    const entries: Task[] = [];
    tasks.forEach((task) => {
      if (task.createdAt) {
        entries.push(task);
      }
      if (task.subtasks) {
        task.subtasks.forEach((subtask) => {
          if (subtask.createdAt) {
            entries.push(subtask);
          }
        });
      }
    });
    return entries;
  }, [tasks]);

  const dateRange = useMemo(() => {
    if (flattenedTasks.length === 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const future = new Date(today);
      future.setDate(future.getDate() + 7);

      const daysArray = Array.from({ length: 8 }, (_, idx) => {
        const date = new Date(today);
        date.setDate(today.getDate() + idx);
        return date;
      });

      return {
        minDate: today,
        maxDate: future,
        totalDays: 7,
        daysArray,
      };
    }

    const startTimes = flattenedTasks.map((task) =>
      new Date(task.createdAt).getTime()
    );
    const endTimes = flattenedTasks.map((task) =>
      task.dueDate ? new Date(task.dueDate).getTime() : new Date(task.createdAt).getTime()
    );

    const minDate = new Date(Math.min(...startTimes));
    const maxDate = new Date(Math.max(...endTimes));

    minDate.setHours(0, 0, 0, 0);
    maxDate.setHours(0, 0, 0, 0);

    minDate.setDate(minDate.getDate() - 3);
    maxDate.setDate(maxDate.getDate() + 3);

    const totalDays = Math.max(
      1,
      Math.ceil((maxDate.getTime() - minDate.getTime()) / MS_PER_DAY)
    );

    const daysArray = Array.from({ length: totalDays + 1 }, (_, idx) => {
      const date = new Date(minDate);
      date.setDate(minDate.getDate() + idx);
      return date;
    });

    return { minDate, maxDate, totalDays, daysArray };
  }, [flattenedTasks]);

  const timelineWidth = (dateRange.daysArray.length) * DAY_WIDTH;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOffset =
    (today.getTime() - dateRange.minDate.getTime()) / MS_PER_DAY;
  const showTodayMarker =
    todayOffset >= 0 && todayOffset <= dateRange.totalDays + 1;
  const todayLeftPx = showTodayMarker ? todayOffset * DAY_WIDTH : 0;

  const rows = useMemo(() => {
    const sorted = [...tasks]
      .filter((task) => task.createdAt)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

    const result: TimelineRow[] = [];

    sorted.forEach((task) => {
      const subtasks =
        task.subtasks
          ?.filter((sub) => sub.createdAt)
          .sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          ) ?? [];

      result.push({
        task,
        level: 0,
        childCount: subtasks.length,
      });

      if (subtasks.length > 0 && expandedTasks.has(task._id)) {
        subtasks.forEach((subtask) => {
          result.push({
            task: subtask,
            level: 1,
          });
        });
      }
    });

    return result;
  }, [tasks, expandedTasks]);

  const getTaskPosition = (task: Task) => {
    const start = new Date(task.createdAt);
    start.setHours(0, 0, 0, 0);

    const end = task.dueDate ? new Date(task.dueDate) : new Date(task.createdAt);
    end.setHours(0, 0, 0, 0);

    const startInDays =
      (start.getTime() - dateRange.minDate.getTime()) / MS_PER_DAY;
    const endInDays =
      (end.getTime() - dateRange.minDate.getTime()) / MS_PER_DAY + 1;

    const clampedStart = Math.max(0, startInDays);
    const clampedEnd = Math.min(dateRange.totalDays + 1, Math.max(endInDays, clampedStart + 0.5));

    const leftPx = clampedStart * DAY_WIDTH;
    const widthPx = Math.max(
      (clampedEnd - clampedStart) * DAY_WIDTH,
      DAY_WIDTH * 0.45
    );

    return { leftPx, widthPx };
  };

  const getStatusMeta = (status: string) =>
    STATUS_META[status] ??
    {
      label: 'Em curso',
      className:
        'bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
    };

  const renderLegend = () => (
    <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
      {(['high', 'medium', 'low'] as const).map((priority) => {
        const meta = getPriorityMeta(priority);
        return (
          <div key={priority} className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${meta.dotClass}`}
            />
            <span className="font-medium">{meta.label} prioridade</span>
          </div>
        );
      })}
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 border border-dashed border-purple-400 dark:border-purple-500 rounded-full" />
        <span className="font-medium">Hoje</span>
      </div>
    </div>
  );

  if (rows.length === 0) {
    return (
      <Card>
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Nenhuma tarefa com datas disponíveis para exibir.
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="overflow-x-auto">
          <div style={{ minWidth: 720 + timelineWidth }}>
            {/* Header */}
            <div className="flex">
              <div className="w-72 shrink-0 px-4 py-3 bg-gray-50 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Tarefa
                </p>
              </div>
              <div className="flex-1 border-b border-gray-200 dark:border-gray-800">
                <div className="relative" style={{ width: timelineWidth }}>
                  {showTodayMarker && (
                    <div
                      className="absolute inset-y-0 w-[2px] bg-purple-500/70 z-20 pointer-events-none"
                      style={{ left: todayLeftPx }}
                    />
                  )}
                  <div
                    className="grid text-xs font-medium text-gray-600 dark:text-gray-300"
                    style={{
                      gridTemplateColumns: `repeat(${dateRange.daysArray.length}, ${DAY_WIDTH}px)`,
                    }}
                  >
                    {dateRange.daysArray.map((date, idx) => {
                      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                      const isToday =
                        date.toDateString() === today.toDateString();
                      return (
                        <div
                          key={idx}
                          className={`relative border-l border-gray-200 dark:border-gray-800 px-2 py-3 ${
                            isWeekend ? 'bg-gray-50 dark:bg-gray-900/50' : ''
                          } ${isToday ? 'bg-purple-50/70 dark:bg-purple-900/30 text-purple-600 dark:text-purple-200 font-semibold' : ''
                          }`}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <span>{date.getDate().toString().padStart(2, '0')}</span>
                            <span className="text-[10px] uppercase tracking-wide">
                              {date.toLocaleDateString('pt-PT', { month: 'short' })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Rows */}
            {rows.map((row, rowIndex) => {
              const { task, level, childCount } = row;
              const priorityMeta = getPriorityMeta(task.priority);
              const statusMeta = getStatusMeta(task.status);
              const position = getTaskPosition(task);
              const isSubtask = level > 0;
              const rowBackground =
                rowIndex % 2 === 0
                  ? 'bg-white dark:bg-gray-900/70'
                  : 'bg-gray-50 dark:bg-gray-900/50';

              return (
                <div
                  key={`${task._id}-${level}`}
                  className={`flex border-b border-gray-200 dark:border-gray-800 transition-colors ${rowBackground} hover:bg-purple-50/40 dark:hover:bg-purple-900/20`}
                  onClick={() => onTaskClick?.(task)}
                  role="button"
                >
                  <div className="w-72 shrink-0 px-4 py-3 border-r border-gray-200 dark:border-gray-800">
                    <div
                      className="flex items-start gap-3"
                      style={{ paddingLeft: level * 20 }}
                    >
                      {level === 0 && (childCount ?? 0) > 0 ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTaskExpansion(task._id);
                          }}
                          className="mt-1 hover:scale-110 transition-transform text-gray-600 dark:text-gray-400"
                          aria-label={
                            expandedTasks.has(task._id)
                              ? 'Colapsar subtarefas'
                              : 'Expandir subtarefas'
                          }
                        >
                          {expandedTasks.has(task._id) ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      ) : (
                        <span className="mt-1 w-4" />
                      )}
                      <div
                        className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${priorityMeta.dotClass}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm font-semibold truncate ${
                            isSubtask
                              ? 'text-gray-700 dark:text-gray-200'
                              : 'text-gray-900 dark:text-gray-100'
                          }`}
                        >
                          {task.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span
                            className={`px-2 py-0.5 text-[11px] rounded-full font-medium ${statusMeta.className}`}
                          >
                            {statusMeta.label}
                          </span>
                          <span
                            className={`text-[11px] ${priorityMeta.badgeClass}`}
                          >
                            {priorityMeta.label}
                          </span>
                          <span className="text-[11px] text-gray-500 dark:text-gray-400">
                            {formatDate(new Date(task.createdAt))}
                            {task.dueDate
                              ? ` → ${formatDate(new Date(task.dueDate))}`
                              : ''}
                          </span>
                        </div>
                      </div>
                      {task.points && (
                        <span className="text-xs font-semibold text-purple-600 dark:text-purple-300 whitespace-nowrap">
                          +{task.points} pts
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    className="flex-1 relative"
                    style={{ width: timelineWidth }}
                  >
                    {showTodayMarker && (
                      <div
                        className="absolute inset-y-0 w-[2px] bg-purple-500/50 z-20 pointer-events-none"
                        style={{ left: todayLeftPx }}
                      />
                    )}
                    <div
                      className="grid h-12"
                      style={{
                        gridTemplateColumns: `repeat(${dateRange.daysArray.length}, ${DAY_WIDTH}px)`,
                      }}
                    >
                      {dateRange.daysArray.map((date, idx) => {
                        const isWeekend =
                          date.getDay() === 0 || date.getDay() === 6;
                        return (
                          <div
                            key={idx}
                            className={`h-full border-l border-gray-200 dark:border-gray-800 ${
                              isWeekend
                                ? 'bg-gray-50 dark:bg-gray-900/45'
                                : 'bg-transparent'
                            }`}
                          />
                        );
                      })}
                    </div>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: position.widthPx }}
                      transition={{ duration: 0.4, delay: rowIndex * 0.05 }}
                      className={`pointer-events-none absolute top-2.5 h-7 rounded-full shadow-sm border border-white/50 dark:border-gray-900/40 bg-gradient-to-r ${priorityMeta.barClass} text-white/90`}
                      style={{
                        left: position.leftPx,
                        minWidth: DAY_WIDTH * 0.45,
                      }}
                    >
                      <div className="flex items-center justify-between h-full px-3 text-[11px] font-medium">
                        <span className="truncate pr-2">
                          {task.title}
                        </span>
                        {task.dueDate && (
                          <span className="opacity-80">
                            {formatDate(new Date(task.dueDate))}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {renderLegend()}
    </div>
  );
}
