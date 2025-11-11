import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import OnboardingProvider from './components/onboarding/OnboardingProvider';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Goals from './pages/Goals';
import Gamification from './pages/Gamification';
import Training from './pages/Training';
import Reports from './pages/Reports';
import Teams from './pages/Teams';
import Settings from './pages/Settings';
import Rankings from './pages/Rankings';
import Profile from './pages/Profile';
import Challenges from './pages/Challenges';
import Rewards from './pages/Rewards';
import Users from './pages/Users';
import AuditLogs from './pages/AuditLogs';
import ActivityFeed from './pages/ActivityFeed';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const isAuthenticated = !!(user && token);
  
  // Se não está autenticado ou não tem token (após hidratação), redirecionar para login
  if (hasHydrated && (!isAuthenticated || !token)) {
    return <Navigate to="/login" replace />;
  }
  
  // Aguardar hidratação antes de renderizar
  if (!hasHydrated) {
    return null;
  }
  
  return <>{children}</>;
}

function App() {
  // Garantir que o store está marcado como hidratado após a primeira renderização
  useEffect(() => {
    // Aguardar um tick para garantir que a rehidratação do Zustand aconteceu
    const timer = setTimeout(() => {
      const state = useAuthStore.getState();
      if (!state._hasHydrated) {
        // Marcar como hidratado - mesmo que não haja dados, o store foi restaurado
        useAuthStore.setState({ _hasHydrated: true });
      }
      
      // Debug: verificar se os dados foram restaurados
      console.log('App: Estado do auth store:', {
        hasUser: !!state.user,
        hasToken: !!state.token,
        hasHydrated: state._hasHydrated,
        localStorage: localStorage.getItem('auth-storage') ? 'presente' : 'ausente'
      });
    }, 100); // Aumentar delay para garantir que a rehidratação aconteceu
    return () => clearTimeout(timer);
  }, []);
  return (
    <BrowserRouter>
      <OnboardingProvider>
        <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/tasks"
          element={
            <PrivateRoute>
              <Tasks />
            </PrivateRoute>
          }
        />
        <Route
          path="/goals"
          element={
            <PrivateRoute>
              <Goals />
            </PrivateRoute>
          }
        />
        <Route
          path="/gamification"
          element={
            <PrivateRoute>
              <Gamification />
            </PrivateRoute>
          }
        />
        <Route
          path="/training"
          element={
            <PrivateRoute>
              <Training />
            </PrivateRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <PrivateRoute>
              <Reports />
            </PrivateRoute>
          }
        />
        <Route
          path="/teams"
          element={
            <PrivateRoute>
              <Teams />
            </PrivateRoute>
          }
        />
              <Route
                path="/settings"
                element={
                  <PrivateRoute>
                    <Settings />
                  </PrivateRoute>
                }
              />
              <Route
                path="/rankings"
                element={
                  <PrivateRoute>
                    <Rankings />
                  </PrivateRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                }
              />
              <Route
                path="/challenges"
                element={
                  <PrivateRoute>
                    <Challenges />
                  </PrivateRoute>
                }
              />
        <Route
          path="/rewards"
          element={
            <PrivateRoute>
              <Rewards />
            </PrivateRoute>
          }
        />
        <Route
          path="/users"
          element={
            <PrivateRoute>
              <Users />
            </PrivateRoute>
          }
        />
        <Route
          path="/audit"
          element={
            <PrivateRoute>
              <AuditLogs />
            </PrivateRoute>
          }
        />
        <Route
          path="/feed"
          element={
            <PrivateRoute>
              <ActivityFeed />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </OnboardingProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--toast-bg, #fff)',
            color: 'var(--toast-color, #333)',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          },
          className: 'dark:bg-gray-800 dark:text-gray-100 dark:border dark:border-gray-700',
          success: {
            iconTheme: {
              primary: '#8b5cf6',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </BrowserRouter>
  );
}

export default App;

