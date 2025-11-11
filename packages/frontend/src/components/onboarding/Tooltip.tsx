import { motion, AnimatePresence } from 'framer-motion';
import { X, Info } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useOnboardingStore } from '../../stores/onboardingStore';

interface TooltipProps {
  id: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
  showOnce?: boolean;
  delay?: number;
}

export default function Tooltip({
  id,
  content,
  position = 'bottom',
  children,
  showOnce = true,
  delay = 0,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { tooltipsShown, markTooltipShown } = useOnboardingStore();

  useEffect(() => {
    // Verificar se já foi mostrado
    if (showOnce && tooltipsShown.has(id)) {
      setHasShown(true);
      return;
    }

    // Delay antes de mostrar
    const timer = setTimeout(() => {
      if (!hasShown) {
        setIsVisible(true);
        if (showOnce) {
          markTooltipShown(id);
          setHasShown(true);
        }
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [id, showOnce, delay, hasShown, tooltipsShown, markTooltipShown]);

  const handleClose = () => {
    setIsVisible(false);
    if (showOnce) {
      markTooltipShown(id);
      setHasShown(true);
    }
  };

  if (hasShown && showOnce) {
    return <>{children}</>;
  }

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className="relative inline-block" ref={tooltipRef}>
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`absolute z-[10000] ${positionClasses[position]} w-64`}
          >
            <div
              className="p-4 rounded-xl shadow-lg border"
              style={{
                background: 'var(--surface-card)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--color-text-primary)',
              }}
            >
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm">{content}</p>
                </div>
                <button
                  onClick={handleClose}
                  className="flex-shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
                  aria-label="Fechar tooltip"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {/* Arrow */}
              <div
                className={`absolute w-2 h-2 rotate-45 ${
                  position === 'top' ? 'top-full left-1/2 -translate-x-1/2 -mt-1' : ''
                } ${position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 -mb-1' : ''} ${
                  position === 'left' ? 'left-full top-1/2 -translate-y-1/2 -ml-1' : ''
                } ${position === 'right' ? 'right-full top-1/2 -translate-y-1/2 -mr-1' : ''}`}
                style={{
                  background: 'var(--surface-card)',
                  borderRight: `1px solid var(--border-subtle)`,
                  borderBottom: `1px solid var(--border-subtle)`,
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

