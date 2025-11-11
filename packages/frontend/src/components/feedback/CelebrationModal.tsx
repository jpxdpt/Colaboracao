import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Sparkles, X } from 'lucide-react';
import Confetti from './Confetti';
import Button from '../ui/Button';

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  icon?: React.ReactNode;
  type?: 'badge' | 'level' | 'achievement' | 'streak';
}

export default function CelebrationModal({
  isOpen,
  onClose,
  title,
  message,
  icon,
  type = 'achievement',
}: CelebrationModalProps) {
  const icons = {
    badge: <Trophy className="w-20 h-20 text-yellow-500" />,
    level: <Sparkles className="w-20 h-20 text-purple-500" />,
    achievement: <Trophy className="w-20 h-20 text-purple-500" />,
    streak: <Sparkles className="w-20 h-20 text-orange-500" />,
  };

  return (
    <>
      <Confetti trigger={isOpen} type="celebration" duration={3000} />
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[1060] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl dark:shadow-gray-900/50 p-8 max-w-md w-full z-10 border border-gray-200 dark:border-gray-700 transition-colors duration-300"
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>

              <div className="text-center space-y-4">
                <motion.div
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.6 }}
                  className="flex justify-center"
                >
                  {icon || icons[type]}
                </motion.div>

                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl font-bold text-gradient-purple"
                >
                  {title}
                </motion.h2>

                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-gray-600 dark:text-gray-300 text-lg"
                >
                  {message}
                </motion.p>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="pt-4"
                >
                  <Button onClick={onClose} variant="gamified">
                    Continuar
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

