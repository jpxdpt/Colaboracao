import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Coins } from 'lucide-react';

interface PointsCounterProps {
  points: number;
  animated?: boolean;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'highlight';
}

export default function PointsCounter({
  points,
  animated = true,
  showIcon = true,
  size = 'md',
  variant = 'default',
}: PointsCounterProps) {
  const [displayPoints, setDisplayPoints] = useState(animated ? 0 : points);

  useEffect(() => {
    if (animated) {
      const duration = 1500;
      const steps = 60;
      const increment = points / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= points) {
          setDisplayPoints(points);
          clearInterval(timer);
        } else {
          setDisplayPoints(current);
        }
      }, duration / steps);

      return () => clearInterval(timer);
    } else {
      setDisplayPoints(points);
    }
  }, [points, animated]);

  const sizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`flex items-center gap-2 ${variant === 'highlight' ? 'bg-gradient-purple text-white px-4 py-2 rounded-xl shadow-glow-purple' : ''}`}
    >
      {showIcon && (
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
        >
          <Coins className={`${size === 'sm' ? 'w-5 h-5' : size === 'md' ? 'w-6 h-6' : 'w-8 h-8'} ${variant === 'highlight' ? 'text-white' : 'text-purple-600'}`} />
        </motion.div>
      )}
      <motion.span
        className={`font-bold ${sizes[size]} ${variant === 'highlight' ? 'text-white' : 'text-gradient-purple'}`}
      >
        {Math.round(displayPoints).toLocaleString('pt-PT')}
      </motion.span>
    </motion.div>
  );
}

