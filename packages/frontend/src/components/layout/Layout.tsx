import { ReactNode, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useThemeStore } from '../../stores/themeStore';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const theme = useThemeStore((state) => state.theme);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebarCollapsed') === 'true';
    }
    return false;
  });
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  return (
    <div
      className="min-h-screen flex transition-colors duration-300"
      style={{ background: 'var(--color-bg-primary)' }}
    >
      <Sidebar onCollapseChange={setSidebarCollapsed} />
      <motion.div 
        className="flex-1 flex flex-col min-w-0 overflow-hidden"
        animate={{
          marginLeft: isDesktop ? (sidebarCollapsed ? '0px' : '256px') : '0',
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
          mass: 0.8,
        }}
      >
        <Navbar />
        <main id="main-content" className="flex-1 overflow-y-auto py-4 lg:py-6 w-full" tabIndex={-1}>{children}</main>
      </motion.div>
    </div>
  );
}

