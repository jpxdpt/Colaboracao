import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import TasksPage from './pages/TasksPage';
import UsersPage from './pages/UsersPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import NotificationsPage from './pages/NotificationsPage';
import ProtectedRoute from './components/ProtectedRoute';

function AppRoutes() {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to={isAdmin ? '/admin' : '/user'} /> : <Login />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to={isAdmin ? '/admin' : '/user'} /> : <Register />}
      />
      
      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="tarefas" element={<Navigate to="/admin/tarefas/kanban" replace />} />
        <Route path="tarefas/kanban" element={<TasksPage />} />
        <Route path="tarefas/calendario" element={<TasksPage />} />
        <Route path="tarefas/gantt" element={<TasksPage />} />
        <Route path="utilizadores" element={<UsersPage />} />
        <Route path="relatorios" element={<ReportsPage />} />
        <Route path="notificacoes" element={<NotificationsPage />} />
        <Route path="configuracoes" element={<SettingsPage />} />
      </Route>

      {/* User Routes */}
      <Route
        path="/user"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/user/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="tarefas" element={<Navigate to="/user/tarefas/kanban" replace />} />
        <Route path="tarefas/kanban" element={<TasksPage />} />
        <Route path="tarefas/calendario" element={<TasksPage />} />
        <Route path="tarefas/gantt" element={<TasksPage />} />
        <Route path="notificacoes" element={<NotificationsPage />} />
        <Route path="configuracoes" element={<SettingsPage />} />
      </Route>

      <Route
        path="/"
        element={
          <Navigate to={isAuthenticated ? (isAdmin ? '/admin' : '/user') : '/login'} replace />
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
