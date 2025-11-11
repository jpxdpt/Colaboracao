import { ButtonHTMLAttributes, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'gamified' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 focus:outline-none focus:ring-4 disabled:opacity-60 disabled:cursor-not-allowed';

    const variants = {
      primary:
        'bg-gradient-primary text-white shadow-soft-brand hover:shadow-elevated focus:ring-[rgba(139,92,246,0.35)] focus:ring-offset-0',
      secondary:
        'bg-[var(--surface-card)] text-[var(--color-text-primary)] border border-[var(--border-subtle)] shadow-sm hover:border-[var(--border-strong)] hover:shadow-md focus:ring-[rgba(129,140,248,0.25)] focus:ring-offset-0',
      gamified:
        'bg-gradient-purple text-white shadow-glow-purple hover:shadow-glow-purple hover:shadow-2xl focus:ring-[rgba(139,92,246,0.4)] focus:ring-offset-0 animate-none',
      danger:
        'bg-gradient-danger text-white shadow-soft-brand hover:shadow-elevated focus:ring-[rgba(248,113,113,0.35)] focus:ring-offset-0',
      ghost:
        'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--surface-muted)] focus:ring-[rgba(129,140,248,0.25)] focus:ring-offset-0',
    };

    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled || loading ? 1 : 1.05 }}
        whileTap={{ scale: disabled || loading ? 1 : 0.95 }}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Carregando...
          </>
        ) : (
          <>
            {icon && <span className="mr-2">{icon}</span>}
            {children}
          </>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export default Button;

