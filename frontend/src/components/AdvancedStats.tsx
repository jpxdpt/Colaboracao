import { TaskWithRelations } from '../types';
import { format, subDays, startOfDay } from 'date-fns';
import { pt } from 'date-fns/locale/pt';

interface AdvancedStatsProps {
  tasks: TaskWithRelations[];
}

const AdvancedStats = ({ tasks }: AdvancedStatsProps) => {
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const overdueTasks = tasks.filter(
    (t) => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed'
  );

  // Tarefas completadas nos últimos 7 dias
  const last7Days = completedTasks.filter((task) => {
    if (!task.updated_at) return false;
    const taskDate = new Date(task.updated_at);
    const sevenDaysAgo = subDays(new Date(), 7);
    return taskDate >= sevenDaysAgo;
  });

  // Taxa de conclusão
  const completionRate =
    tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  // Tempo médio de conclusão (simulado - seria necessário tracking real)
  const avgCompletionDays = tasks.length > 0 ? Math.round(tasks.length / 2) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="card dark:bg-gray-800 dark:border-gray-700">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Taxa de Conclusão</div>
        <div className="text-3xl font-bold text-green-600">{completionRate}%</div>
        <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-green-600 h-2 rounded-full transition-all"
            style={{ width: `${completionRate}%` }}
          ></div>
        </div>
      </div>

      <div className="card dark:bg-gray-800 dark:border-gray-700">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tarefas Atrasadas</div>
        <div className="text-3xl font-bold text-red-600">{overdueTasks.length}</div>
        {overdueTasks.length > 0 && (
          <div className="text-xs text-red-600 dark:text-red-400 mt-2">
            Requerem atenção
          </div>
        )}
      </div>

      <div className="card dark:bg-gray-800 dark:border-gray-700">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          Completadas (7 dias)
        </div>
        <div className="text-3xl font-bold text-blue-600">{last7Days.length}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Última semana
        </div>
      </div>

      <div className="card dark:bg-gray-800 dark:border-gray-700">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          Tarefas em Progresso
        </div>
        <div className="text-3xl font-bold text-yellow-600">
          {tasks.filter((t) => t.status === 'in_progress').length}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Ativas agora
        </div>
      </div>
    </div>
  );
};

export default AdvancedStats;

