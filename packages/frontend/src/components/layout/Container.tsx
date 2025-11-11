import { ReactNode } from 'react';

interface ContainerProps {
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full';
  className?: string;
}

export default function Container({
  children,
  maxWidth = '7xl',
  className = '',
}: ContainerProps) {
  const maxWidths = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full',
  };

  return (
    <div className={`${maxWidths[maxWidth]} mx-auto w-full px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}

