import { HTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'gamified' | 'interactive';
  hover?: boolean;
  glow?: 'purple' | 'blue' | 'fire' | 'green' | null;
}

export default function Card({
  children,
  variant = 'default',
  hover = true,
  glow = null,
  className = '',
  ...props
}: CardProps) {
  const baseStyles = 'rounded-2xl border transition-all duration-300 shadow-soft';

  const variants = {
    default:
      'bg-[var(--surface-card)] border-[var(--border-subtle)] text-[var(--color-text-primary)]',
    gamified:
      'text-[var(--color-text-primary)] border-[var(--border-strong)] bg-[radial-gradient(circle_at_20%_20%,rgba(139,92,246,0.18),rgba(56,189,248,0.06)_45%,rgba(15,23,42,0.02)_100%)] backdrop-blur-sm',
    interactive:
      'bg-[var(--surface-card)] border-[var(--border-subtle)] cursor-pointer hover:border-[var(--border-strong)] hover:shadow-elevated',
  } as const;

  const glowStyles = {
    purple: 'hover:shadow-glow-purple',
    blue: 'hover:shadow-glow-blue',
    fire: 'hover:shadow-glow-fire',
    green: 'hover:shadow-glow-green',
  };

  const cardContent = (
    <div
      className={`${baseStyles} ${variants[variant]} ${glow ? glowStyles[glow] : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );

  if (hover && variant === 'interactive') {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
      >
        {cardContent}
      </motion.div>
    );
  }

  return cardContent;
}

