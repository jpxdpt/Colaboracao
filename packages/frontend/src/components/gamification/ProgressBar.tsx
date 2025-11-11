import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  color?: 'purple' | 'blue' | 'green' | 'fire' | 'custom';
  customColor?: string;
  animated?: boolean;
  height?: 'sm' | 'md' | 'lg';
}

export default function ProgressBar({
  progress,
  label,
  showPercentage = true,
  color = 'purple',
  customColor,
  animated = true,
  height = 'md',
}: ProgressBarProps) {
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    if (animated) {
      const duration = 1000;
      const steps = 60;
      const increment = progress / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= progress) {
          setDisplayProgress(progress);
          clearInterval(timer);
        } else {
          setDisplayProgress(current);
        }
      }, duration / steps);

      return () => clearInterval(timer);
    } else {
      setDisplayProgress(progress);
    }
  }, [progress, animated]);

  const heights = {
    sm: 'h-2',
    md: 'h-4',
    lg: 'h-6',
  };

  const colorClasses = {
    purple: 'bg-gradient-to-r from-purple-500 to-pink-500',
    blue: 'bg-gradient-to-r from-blue-500 to-cyan-500',
    green: 'bg-gradient-to-r from-green-500 to-emerald-500',
    fire: 'bg-gradient-to-r from-orange-500 to-red-500',
    custom: '',
  };

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
          {showPercentage && (
            <span className="text-sm font-semibold text-gray-600">
              {Math.round(displayProgress)}%
            </span>
          )}
        </div>
      )}
      <div className={`w-full ${heights[height]} bg-gray-200 rounded-full overflow-hidden`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${displayProgress}%` }}
          transition={{ duration: animated ? 1 : 0.3, ease: 'easeOut' }}
          className={`h-full rounded-full ${customColor ? `bg-[${customColor}]` : colorClasses[color]}`}
          style={customColor ? { backgroundColor: customColor } : undefined}
        />
      </div>
    </div>
  );
}

