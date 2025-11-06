import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DarkModeToggle from '../components/DarkModeToggle';
import { User, Settings as SettingsIcon, Bell, Shield } from 'lucide-react';

const SettingsPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    taskUpdates: true,
    deadlineReminders: true,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Configurações</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Gerir as suas preferências e configurações da conta
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Perfil */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                <User className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Perfil</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Informações da sua conta
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={user?.name || ''}
                  disabled
                  className="input w-full bg-gray-50 dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="input w-full bg-gray-50 dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Função
                </label>
                <input
                  type="text"
                  value={user?.role === 'admin' ? 'Administrador' : 'Utilizador'}
                  disabled
                  className="input w-full bg-gray-50 dark:bg-gray-700"
                />
              </div>
            </div>
          </div>

          {/* Notificações */}
          <div className="card dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                <Bell className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Notificações
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Gerir preferências de notificações
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Notificações por Email
                </span>
                <input
                  type="checkbox"
                  checked={notifications.email}
                  onChange={(e) =>
                    setNotifications({ ...notifications, email: e.target.checked })
                  }
                  className="toggle"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Notificações Push
                </span>
                <input
                  type="checkbox"
                  checked={notifications.push}
                  onChange={(e) =>
                    setNotifications({ ...notifications, push: e.target.checked })
                  }
                  className="toggle"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Atualizações de Tarefas
                </span>
                <input
                  type="checkbox"
                  checked={notifications.taskUpdates}
                  onChange={(e) =>
                    setNotifications({ ...notifications, taskUpdates: e.target.checked })
                  }
                  className="toggle"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Lembretes de Prazos
                </span>
                <input
                  type="checkbox"
                  checked={notifications.deadlineReminders}
                  onChange={(e) =>
                    setNotifications({ ...notifications, deadlineReminders: e.target.checked })
                  }
                  className="toggle"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Aparência */}
          <div className="card dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                <SettingsIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Aparência</h3>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Modo Escuro</span>
              <DarkModeToggle />
            </div>
          </div>

          {/* Segurança */}
          <div className="card dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                <Shield className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Segurança</h3>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Para alterar a sua password, contacte o administrador.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

