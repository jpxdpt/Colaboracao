import { motion } from 'framer-motion';
import { Award, Sparkles } from 'lucide-react';

enum BadgeRarity {
  COMMON = 'common',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

interface BadgeDisplayProps {
  name: string;
  description?: string;
  icon?: string;
  rarity: BadgeRarity;
  earned?: boolean;
  earnedAt?: Date;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  onClick?: () => void;
}

export default function BadgeDisplay({
  name,
  description,
  icon,
  rarity,
  earned = false,
  earnedAt,
  size = 'md',
  showTooltip = false,
  onClick,
}: BadgeDisplayProps) {
  const sizes = {
    sm: 'w-12 h-12 text-lg',
    md: 'w-20 h-20 text-2xl',
    lg: 'w-32 h-32 text-4xl',
  };

  const rarityStyles = {
    [BadgeRarity.COMMON]: 'bg-gray-100 border-gray-300 text-gray-700',
    [BadgeRarity.RARE]: 'bg-blue-100 border-blue-300 text-blue-700',
    [BadgeRarity.EPIC]: 'bg-purple-100 border-purple-300 text-purple-700 shadow-glow-purple',
    [BadgeRarity.LEGENDARY]:
      'bg-gradient-to-br from-yellow-100 to-orange-100 border-yellow-400 text-yellow-800 shadow-glow-fire',
  };

  return (
    <motion.div
      whileHover={{ scale: earned ? 1.1 : 1 }}
      whileTap={{ scale: 0.95 }}
      className={`relative ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div
        className={`${sizes[size]} ${rarityStyles[rarity]} rounded-full border-2 flex items-center justify-center relative overflow-hidden`}
      >
        {earned ? (
          <>
            {icon ? (
              <span>{icon}</span>
            ) : (
              <Award className={`${size === 'sm' ? 'w-6 h-6' : size === 'md' ? 'w-10 h-10' : 'w-16 h-16'}`} />
            )}
            {rarity === BadgeRarity.LEGENDARY && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0"
              >
                <Sparkles className="w-full h-full text-yellow-400 opacity-50" />
              </motion.div>
            )}
          </>
        ) : (
          <div className="w-full h-full bg-gray-200 opacity-50 flex items-center justify-center">
            <Award className={`${size === 'sm' ? 'w-6 h-6' : size === 'md' ? 'w-10 h-10' : 'w-16 h-16'} text-gray-400`} />
          </div>
        )}
      </div>

      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
          <div className="font-semibold">{name}</div>
          {description && <div className="text-xs text-gray-300 mt-1">{description}</div>}
          {earnedAt && (
            <div className="text-xs text-gray-400 mt-1">
              Conquistado em {new Date(earnedAt).toLocaleDateString('pt-PT')}
            </div>
          )}
        </div>
      )}

      {size !== 'sm' && (
        <div className="mt-2 text-center">
          <div className={`text-sm font-semibold ${earned ? 'text-gray-900' : 'text-gray-400'}`}>
            {name}
          </div>
        </div>
      )}
    </motion.div>
  );
}

