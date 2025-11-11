import { motion } from 'framer-motion';
import { Coins, TrendingUp, TrendingDown } from 'lucide-react';

interface CurrencyDisplayProps {
  balance: number;
  recentChange?: number; // positivo ou negativo
  showChange?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function CurrencyDisplay({
  balance,
  recentChange,
  showChange = false,
  size = 'md',
}: CurrencyDisplayProps) {
  const sizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  return (
    <div className="flex items-center gap-3">
      <motion.div
        animate={{ rotate: [0, -10, 10, -10, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
        className="bg-gradient-to-br from-green-400 to-emerald-500 p-3 rounded-xl shadow-lg"
      >
        <Coins className={`${size === 'sm' ? 'w-5 h-5' : size === 'md' ? 'w-6 h-6' : 'w-8 h-8'} text-white`} />
      </motion.div>

      <div>
        <div className={`font-bold ${sizes[size]} text-gray-900`}>
          {balance.toLocaleString('pt-PT')}
        </div>
        {showChange && recentChange !== undefined && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-1 text-sm font-medium ${
              recentChange >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {recentChange >= 0 ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            {Math.abs(recentChange).toLocaleString('pt-PT')}
          </motion.div>
        )}
      </div>
    </div>
  );
}

