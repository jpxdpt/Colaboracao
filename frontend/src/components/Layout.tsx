import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { Menu } from 'lucide-react';

const Layout = () => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false); // Por padrão fechado

  // Determinar a view atual baseada na rota
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/tarefas/kanban')) {
      setCurrentView('tasks-kanban');
    } else if (path.includes('/tarefas/calendario')) {
      setCurrentView('tasks-calendar');
    } else if (path.includes('/tarefas/gantt')) {
      setCurrentView('tasks-gantt');
    } else if (path.includes('/tarefas')) {
      setCurrentView('tasks-kanban');
    } else if (path.includes('/utilizadores')) {
      setCurrentView('users');
    } else if (path.includes('/relatorios')) {
      setCurrentView('reports');
    } else if (path.includes('/configuracoes')) {
      setCurrentView('settings');
    } else {
      setCurrentView('dashboard');
    }
  }, [location.pathname]);

  const handleViewChange = (view: string) => {
    console.log('Layout: handleViewChange called with:', view);
    const basePath = isAdmin ? '/admin' : '/user';
    
    if (view.startsWith('tasks-')) {
      const taskView = view.split('-')[1];
      // Garantir que o nome da rota está correto
      const routeMap: Record<string, string> = {
        kanban: 'kanban',
        calendar: 'calendario',
        calendario: 'calendario',
        gantt: 'gantt',
      };
      const routeName = routeMap[taskView] || taskView;
      navigate(`${basePath}/tarefas/${routeName}`);
    } else if (view === 'tasks') {
      navigate(`${basePath}/tarefas/kanban`);
    } else if (view === 'users') {
      navigate(`${basePath}/utilizadores`);
    } else if (view === 'reports') {
      navigate(`${basePath}/relatorios`);
    } else if (view === 'settings') {
      navigate(`${basePath}/configuracoes`);
    } else {
      navigate(`${basePath}/dashboard`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Botão Hamburger para abrir o menu (sempre visível quando fechado) */}
      {!sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="fixed top-4 left-4 z-40 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300"
        >
          <Menu className="w-5 h-5 text-gray-900 dark:text-white" />
        </button>
      )}

      {/* Overlay para fechar o sidebar no mobile quando aberto */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        isAdmin={isAdmin || false}
        onLogout={logout}
        currentView={currentView}
        onViewChange={handleViewChange}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Content */}
      <div className={`min-h-screen transition-all duration-300 ${
        sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'
      }`}>
        <div className={`transition-all duration-300 ${
          !sidebarOpen 
            ? 'pt-20 pl-20 lg:pt-20 lg:pl-20' 
            : 'pt-6 pl-6'
        }`}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;

