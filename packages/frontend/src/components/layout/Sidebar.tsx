import { NavLink } from 'react-router-dom';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import {
  LayoutDashboard,
  CheckSquare,
  Target,
  FileText,
  GraduationCap,
  Trophy,
  Users,
  Flame,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Award,
  Zap,
  Gift,
  UserCog,
  FileSearch,
  Activity,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

const navItems: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/feed', label: 'Feed', icon: Activity },
  { path: '/tasks', label: 'Tarefas', icon: CheckSquare },
  { path: '/goals', label: 'Metas', icon: Target },
  { path: '/reports', label: 'Reportes', icon: FileText },
  { path: '/training', label: 'Formação', icon: GraduationCap },
  { path: '/gamification', label: 'Gamificação', icon: Trophy },
  { path: '/rankings', label: 'Rankings', icon: Award },
  { path: '/challenges', label: 'Desafios', icon: Zap },
  { path: '/rewards', label: 'Recompensas', icon: Gift },
  { path: '/teams', label: 'Equipas', icon: Users },
];

interface SidebarProps {
  onCollapseChange?: (collapsed: boolean) => void;
}

export default function Sidebar({ onCollapseChange }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebarCollapsed') === 'true';
    }
    return false;
  });
  const user = useAuthStore((state) => state.user);
  const theme = useThemeStore((state) => state.theme);
  const sidebarWidth = 256; // 64 * 4 = 256px (w-64)

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;
    if (info.offset.x < -threshold) {
      setIsCollapsed(true);
      localStorage.setItem('sidebarCollapsed', 'true');
      onCollapseChange?.(true);
    } else if (info.offset.x > threshold) {
      setIsCollapsed(false);
      localStorage.setItem('sidebarCollapsed', 'false');
      onCollapseChange?.(false);
    }
  };

  const handleToggle = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    localStorage.setItem('sidebarCollapsed', String(newCollapsed));
    onCollapseChange?.(newCollapsed);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl shadow-lg transition-transform hover:-translate-y-0.5"
        style={{
          background: 'var(--surface-card)',
          color: 'var(--color-text-primary)',
          border: `1px solid ${'var(--border-subtle)'}`,
        }}
      >
        {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isDesktop 
            ? (isCollapsed ? -sidebarWidth : 0) 
            : isMobileOpen 
            ? 0 
            : '-100%',
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
          mass: 0.8,
        }}
        drag={isDesktop ? 'x' : false}
        dragConstraints={{ left: -sidebarWidth, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        className="fixed lg:fixed inset-y-0 left-0 z-40 w-64 flex-shrink-0 cursor-grab active:cursor-grabbing transition-all duration-300"
        style={{
          background: 'var(--surface-card)',
          borderRight: `1px solid ${'var(--border-subtle)'}`,
          boxShadow: 'var(--shadow-soft)',
        }}
      >
        <div className="flex flex-col h-full relative">
          {/* Toggle Button - Only show when sidebar is expanded */}
          {isDesktop && !isCollapsed && (
            <button
              onClick={handleToggle}
              className="absolute -right-3 top-20 z-50 w-6 h-12 rounded-r-lg flex items-center justify-center shadow-sm transition-transform hover:translate-x-0.5"
              style={{
                background: 'var(--surface-card)',
                border: `1px solid ${'var(--border-subtle)'}`,
                color: 'var(--color-text-secondary)',
              }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Logo */}
          <motion.div 
            className="p-6 border-b"
            style={{ borderColor: 'var(--border-subtle)' }}
            animate={{ opacity: isCollapsed ? 0 : 1 }}
            transition={{ duration: 0.2 }}
          >
            <h1 className="text-2xl font-bold text-gradient-purple flex items-center gap-3">
              <CheckSquare className="w-7 h-7 text-[var(--color-text-primary)]" />
              <span>Taskify</span>
            </h1>
          </motion.div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {[...navItems,
              ...(user?.role === 'admin'
                ? [
                    { path: '/users', label: 'Utilizadores', icon: UserCog },
                    { path: '/audit', label: 'Auditoria', icon: FileSearch },
                  ]
                : []),
            ].map((item, index) => (
              <motion.div
                key={item.path}
                animate={{ opacity: isCollapsed ? 0 : 1 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
              >
                <NavLink
                  to={item.path}
                  onClick={() => setIsMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                      isActive
                        ? 'text-white shadow-glow-purple'
                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--color-text-primary)]'
                    }`
                  }
                  style={({ isActive }) =>
                    isActive
                      ? {
                          backgroundImage: 'var(--gradient-purple)',
                        }
                      : {
                          background: 'transparent',
                        }
                  }
                >
                  {({ isActive }) => (
                    <>
                      <motion.div
                        animate={isActive ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ duration: 0.3 }}
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                      </motion.div>
                      <span className="flex-1">{item.label}</span>
                      {item.badge && item.badge > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              </motion.div>
            ))}
          </nav>

          {/* User Info */}
          {user && (
            <motion.div 
              className="p-4 border-t"
              style={{ borderColor: 'var(--border-subtle)' }}
              animate={{ opacity: isCollapsed ? 0 : 1 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                  style={{ backgroundImage: 'var(--gradient-purple)' }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {user.name}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
                    {user.email}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.aside>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-30 lg:hidden"
          style={{ background: 'var(--overlay-backdrop)' }}
        />
      )}

      {/* Floating Toggle Button when collapsed */}
      {isDesktop && isCollapsed && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, x: -20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.8, x: -20 }}
          onClick={handleToggle}
          className="fixed left-2 top-20 z-50 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all group"
          style={{
            background: theme === 'light' ? 'var(--surface-card)' : 'var(--surface-elevated)',
            border: `1.5px solid ${theme === 'light' ? 'var(--border-subtle)' : 'var(--border-strong)'}`,
            color: theme === 'light' ? 'var(--color-text-primary)' : '#fff',
          }}
          whileHover={{ scale: 1.1, x: 4 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            animate={{ x: [0, 3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
          >
            <Menu className="w-6 h-6" />
          </motion.div>
        </motion.button>
      )}
    </>
  );
}

