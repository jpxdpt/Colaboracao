import {
  LayoutDashboard,
  CheckSquare,
  Users,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Calendar,
  BarChart3,
  GanttChartSquare,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface SidebarProps {
  isAdmin?: boolean;
  onLogout: () => void;
  currentView?: string;
  onViewChange?: (view: string) => void;
  isOpen?: boolean;
  onToggle?: () => void;
  // Props antigas (não devem ser usadas)
  onClose?: () => void;
}

const Sidebar = (props: SidebarProps) => {
  // Detetar se está a receber props antigas
  if ('onClose' in props && !props.onViewChange && !props.onToggle) {
    console.error('❌ ERRO: Sidebar está a receber props antigas (onClose)!');
    console.error('O Layout.tsx precisa ser atualizado para usar as novas props.');
    console.error('Props recebidas:', props);
    return (
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-red-100 dark:bg-red-900 p-4">
        <p className="text-red-800 dark:text-red-200 font-bold">
          ERRO: Sidebar recebeu props antigas. Verifique o Layout.tsx
        </p>
      </div>
    );
  }

  const { isAdmin = false, onLogout, currentView, onViewChange, isOpen = false, onToggle } = props;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Expandir automaticamente o item "tasks" se estivermos numa página de tarefas
  const shouldExpandTasks = currentView?.startsWith('tasks-') || currentView === 'tasks';
  const [expandedItems, setExpandedItems] = useState<string[]>(shouldExpandTasks ? ['tasks'] : []);
  
  // Atualizar expandedItems quando currentView mudar
  useEffect(() => {
    if (shouldExpandTasks) {
      setExpandedItems((prev) => (prev.includes('tasks') ? prev : [...prev, 'tasks']));
    }
  }, [currentView, shouldExpandTasks]);
  
  // Verificar se as props necessárias estão presentes
  if (!onViewChange || !onLogout) {
    console.error('❌ Sidebar: Missing required props!', {
      onViewChange: typeof onViewChange,
      onLogout: typeof onLogout,
      allProps: Object.keys(props),
      propsValue: props,
    });
    return null;
  }

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      adminOnly: false,
    },
    {
      id: 'tasks',
      label: 'Tarefas',
      icon: CheckSquare,
      adminOnly: false,
      subItems: [
        { id: 'kanban', label: 'Kanban', icon: LayoutDashboard },
        { id: 'calendar', label: 'Calendário', icon: Calendar },
        { id: 'gantt', label: 'Gantt', icon: GanttChartSquare },
      ],
    },
    ...(isAdmin
      ? [
          {
            id: 'users',
            label: 'Utilizadores',
            icon: Users,
            adminOnly: true,
          },
          {
            id: 'reports',
            label: 'Relatórios',
            icon: FileText,
            adminOnly: true,
          },
        ]
      : []),
  ];

  const handleItemClick = (itemId: string, hasSubItems: boolean) => {
    if (!onViewChange) {
      console.error('Sidebar: onViewChange is not defined! Cannot navigate to:', itemId);
      return;
    }
    
    // Se tem sub-items, expandir/colapsar em vez de navegar
    if (hasSubItems) {
      setExpandedItems((prev) =>
        prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
      );
    } else {
      // Se não tem sub-items, navegar diretamente
      onViewChange(itemId);
      setIsMobileMenuOpen(false);
    }
  };

  const handleSubItemClick = (subItemId: string) => {
    if (!onViewChange) {
      console.error('Sidebar: onViewChange is not defined! Cannot navigate to:', subItemId);
      return;
    }
    // Mapear os IDs dos sub-items para os nomes corretos das rotas
    const routeMap: Record<string, string> = {
      kanban: 'kanban',
      calendar: 'calendario', // Mapear calendar para calendario
      gantt: 'gantt',
    };
    const routeName = routeMap[subItemId] || subItemId;
    onViewChange(`tasks-${routeName}`);
    setIsMobileMenuOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white text-center lg:text-left">
              {isAdmin ? 'Admin Panel' : 'Minhas Tarefas'}
            </h1>
          </div>
          {/* Botão para fechar no desktop */}
          {onToggle && (
            <button
              type="button"
              onClick={onToggle}
              className="lg:block hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center lg:text-left">
          Sistema de Colaboração
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const hasSubItems = 'subItems' in item && item.subItems;
          const isExpanded = expandedItems.includes(item.id);
          // Para items com sub-items, verificar se currentView começa com o id ou é igual
          const isActive = hasSubItems
            ? currentView === item.id || currentView?.startsWith(`${item.id}-`)
            : currentView === item.id;

          return (
            <div key={item.id}>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleItemClick(item.id, !!hasSubItems);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive && !hasSubItems
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium flex-1 text-left">{item.label}</span>
                {hasSubItems && (
                  <div className="flex-shrink-0">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </div>
                )}
              </button>

              {/* Sub-items */}
              {hasSubItems && isExpanded && (
                <div className="ml-4 mt-2 space-y-1 animate-in slide-in-from-top-2 duration-200">
                  {item.subItems.map((subItem) => {
                    const SubIcon = subItem.icon;
                    // Mapear o ID do sub-item para o nome correto da rota para verificar se está ativo
                    const routeMap: Record<string, string> = {
                      kanban: 'kanban',
                      calendar: 'calendario',
                      gantt: 'gantt',
                    };
                    const routeName = routeMap[subItem.id] || subItem.id;
                    const isSubActive = currentView === `tasks-${routeName}` || currentView === `tasks-${subItem.id}`;
                    return (
                      <button
                        key={subItem.id}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSubItemClick(subItem.id);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                          isSubActive
                            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <SubIcon className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-1 text-left">{subItem.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Settings & Logout */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleItemClick('settings', false);
          }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            currentView === 'settings'
              ? 'bg-primary-600 text-white'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium flex-1 text-left">Configurações</span>
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium flex-1 text-left">Sair</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700"
      >
        {isMobileMenuOpen ? (
          <X className="w-6 h-6 text-gray-900 dark:text-white" />
        ) : (
          <Menu className="w-6 h-6 text-gray-900 dark:text-white" />
        )}
      </button>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen
            ? 'translate-x-0'
            : isOpen
            ? 'translate-x-0'
            : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>
    </>
  );
};

export default Sidebar;
