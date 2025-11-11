import { ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1040]"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className={`${sizes[size]} w-full pointer-events-auto rounded-2xl border transition-transform duration-300 flex flex-col max-h-[calc(100vh-4rem)] overflow-hidden`}
              style={{
                background: 'var(--surface-elevated)',
                borderColor: 'var(--border-subtle)',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              {/* Header */}
              {(title || showCloseButton) && (
                <div
                  className="flex items-center justify-between px-6 py-5 border-b flex-shrink-0"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  {title && (
                    <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                      {title}
                    </h2>
                  )}
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className="p-2 rounded-lg transition-colors hover:bg-[var(--surface-muted)]"
                      style={{ color: 'var(--color-text-muted)' }}
                      aria-label="Fechar"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}

              {/* Content */}
              <div
                className="p-6 overflow-y-auto"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

