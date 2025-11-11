import { motion } from 'framer-motion';
import { TrendingUp, Star } from 'lucide-react';
import ProgressBar from './ProgressBar';

interface LevelDisplayProps {
  currentLevel: number;
  nextLevel?: number | null;
  progress: number; // 0-100
  pointsCurrent: number;
  pointsNext?: number | null;
  showDetails?: boolean;
}

export default function LevelDisplay({
  currentLevel,
  nextLevel,
  progress,
  pointsCurrent,
  pointsNext,
  showDetails = true,
}: LevelDisplayProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <motion.div
          whileHover={{ scale: 1.1, rotate: [0, -5, 5, -5, 0] }}
          className="relative"
        >
          <div className="w-12 h-12 bg-gradient-purple rounded-full flex items-center justify-center shadow-glow-purple">
            <Star className="w-6 h-6 text-white fill-white" />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 bg-purple-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white text-[10px]">
            {currentLevel}
          </div>
        </motion.div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Nível {currentLevel}</span>
            {nextLevel && (
              <span className="text-sm font-medium text-gray-500">Nível {nextLevel}</span>
            )}
          </div>
          <ProgressBar
            progress={progress}
            color="purple"
            height="md"
            showPercentage={false}
          />
          {showDetails && pointsNext && (
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
              <TrendingUp className="w-4 h-4" />
              <span>
                {pointsNext - pointsCurrent} pontos até o próximo nível
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

