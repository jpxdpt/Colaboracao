import { useState, useCallback } from 'react';

export function useCelebration() {
  const [isOpen, setIsOpen] = useState(false);
  const [celebrationData, setCelebrationData] = useState<{
    title: string;
    message: string;
    type?: 'badge' | 'level' | 'achievement' | 'streak';
  } | null>(null);

  const celebrate = useCallback(
    (title: string, message: string, type: 'badge' | 'level' | 'achievement' | 'streak' = 'achievement') => {
      setCelebrationData({ title, message, type });
      setIsOpen(true);
    },
    []
  );

  const close = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => setCelebrationData(null), 300);
  }, []);

  return {
    isOpen,
    celebrationData,
    celebrate,
    close,
  };
}

