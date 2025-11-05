import { CheckCircle, Clock, Play, List } from 'lucide-react';

interface StatsCardsProps {
  stats: {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
  };
}

const StatsCards = ({ stats }: StatsCardsProps) => {
  const cards = [
    {
      title: 'Total de Tarefas',
      value: stats.total,
      icon: List,
      color: 'bg-gray-100 text-gray-700',
      bgColor: 'bg-gray-50',
    },
    {
      title: 'Pendentes',
      value: stats.pending,
      icon: Clock,
      color: 'bg-yellow-100 text-yellow-700',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Em Progresso',
      value: stats.in_progress,
      icon: Play,
      color: 'bg-blue-100 text-blue-700',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Concluídas',
      value: stats.completed,
      icon: CheckCircle,
      color: 'bg-green-100 text-green-700',
      bgColor: 'bg-green-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.title} className={`card ${card.bgColor} dark:bg-gray-800 dark:border-gray-700`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{card.title}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{card.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${card.color} dark:opacity-80`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;

