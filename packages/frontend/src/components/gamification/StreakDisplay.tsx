import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

interface StreakDisplayProps {
  days: number;
  atRisk?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function StreakDisplay({
  days,
  atRisk = false,
  size = 'md',
  showLabel = true,
}: StreakDisplayProps) {
  const sizes = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-lg',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <motion.div
      className="flex items-center gap-2"
      animate={days > 0 ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <motion.div
        className={`${sizes[size]} bg-gradient-fire rounded-full flex items-center justify-center shadow-glow-fire relative`}
        animate={days > 0 ? { rotate: [0, -5, 5, -5, 0] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      >
        <Flame className={`${iconSizes[size]} text-white fill-white`} />
        {days > 0 && (
          <motion.div
            className="absolute inset-0 bg-gradient-fire rounded-full opacity-50"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </motion.div>
      {showLabel && (
        <div>
          <div className={`font-bold ${size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-lg'} text-gradient-fire`}>
            {days} {days === 1 ? 'dia' : 'dias'}
          </div>
          {atRisk && (
            <motion.div
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="text-xs text-orange-600 font-medium"
            >
              Em risco!
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
}

