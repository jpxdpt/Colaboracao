import { Bell, Moon, Sun, LogOut, User, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import PointsCounter from '../gamification/PointsCounter';
import LevelDisplay from '../gamification/LevelDisplay';
import StreakDisplay from '../gamification/StreakDisplay';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';

export default function Navbar() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { theme, toggleTheme } = useThemeStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const token = useAuthStore((state) => state.token);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  
  // Aguardar hidratação do store antes de fazer queries
  // Só executar queries se houver token E user E store estiver hidratado
  const isReady = hasHydrated && !!user && !!token;
  
  // Debug: log quando não está pronto mas queries tentam executar
  if (hasHydrated && !isReady && (user || token)) {
    console.warn('Navbar: Queries desabilitadas - faltando:', {
      hasUser: !!user,
      hasToken: !!token,
      hasHydrated
    });
  }
  
  const { data: pointsData } = useQuery({
    queryKey: ['points'],
    queryFn: () => api.get<{ total: number }>('/api/gamification/points'),
    enabled: isReady,
    retry: false,
  });

  const { data: levelData } = useQuery({
    queryKey: ['level-progress'],
    queryFn: () =>
      api.get<{
        currentLevel: number;
        nextLevel: number | null;
        pointsCurrent: number;
        pointsNext: number | null;
        progress: number;
      }>('/api/gamification/levels/progress'),
    enabled: isReady,
    retry: false,
  });

  const { data: streakData } = useQuery({
    queryKey: ['streaks', 'daily_tasks'],
    queryFn: () =>
      api.get<{ consecutiveDays: number; atRisk?: boolean }>(
        '/api/gamification/streaks/daily_tasks'
      ),
    enabled: isReady,
    retry: false,
  });

  return (
    <nav
      className="sticky top-0 z-30 flex-shrink-0 transition-colors duration-300"
      style={{
        background: 'var(--surface-card)',
        borderBottom: `1px solid ${'var(--border-subtle)'}`,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Left side - Gamification Stats */}
          <div className="flex items-center gap-6">
            {pointsData && (
              <div className="hidden md:flex items-center gap-2">
                <PointsCounter points={pointsData.total} size="sm" />
              </div>
            )}

            {levelData && (
              <div className="hidden lg:flex items-center">
                <LevelDisplay
                  currentLevel={levelData.currentLevel}
                  nextLevel={levelData.nextLevel}
                  progress={levelData.progress}
                  pointsCurrent={levelData.pointsCurrent}
                  pointsNext={levelData.pointsNext}
                  showDetails={false}
                />
              </div>
            )}

            {streakData && streakData.consecutiveDays > 0 && (
              <div className="hidden md:flex items-center">
                <StreakDisplay
                  days={streakData.consecutiveDays}
                  atRisk={streakData.atRisk}
                  size="sm"
                />
              </div>
            )}
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-colors hover:bg-[var(--surface-muted)] text-[var(--color-text-secondary)]"
              aria-label="Alternar tema"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg transition-colors relative hover:bg-[var(--surface-muted)] text-[var(--color-text-secondary)]"
                aria-label="Notificações"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-4 z-50"
                  >
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Notificações
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      Nenhuma notificação
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Menu */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-2 rounded-lg transition-colors hover:bg-[var(--surface-muted)] text-[var(--color-text-secondary)]"
                >
                  <img
                    src={
                      user?.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random`
                    }
                    alt={user?.name || 'User'}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {user.name}
                  </span>
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowUserMenu(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-48 rounded-xl border shadow-xl z-40"
                        style={{
                          background: 'var(--surface-card)',
                          borderColor: 'var(--border-subtle)',
                          boxShadow: 'var(--shadow-soft)',
                        }}
                      >
                        <div className="p-2">
                          <Link
                            to="/profile"
                            className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors hover:bg-[var(--surface-muted)] text-[var(--color-text-secondary)]"
                          >
                            <User className="w-4 h-4" /> Perfil
                          </Link>
                          <Link
                            to="/settings"
                            className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors hover:bg-[var(--surface-muted)] text-[var(--color-text-secondary)]"
                          >
                            <Settings className="w-4 h-4" /> Configurações
                          </Link>
                          <div className="border-t my-2" style={{ borderColor: 'var(--border-subtle)' }} />
                          <button
                            onClick={() => {
                              logout();
                              setShowUserMenu(false);
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg w-full text-left transition-colors hover:bg-[rgba(239,68,68,0.12)]"
                            style={{ color: '#ef4444' }}
                          >
                            <LogOut className="w-4 h-4" /> Sair
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

