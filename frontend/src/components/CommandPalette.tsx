import { useState, useEffect, useRef } from 'react';
import { Search, X, FileText, Calendar, Users, Settings, Plus } from 'lucide-react';

interface Command {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNewTask?: () => void;
  onSearch?: () => void;
  onCalendar?: () => void;
  onUsers?: () => void;
  onSettings?: () => void;
}

const CommandPalette = ({
  isOpen,
  onClose,
  onNewTask,
  onSearch,
  onCalendar,
  onUsers,
  onSettings,
}: CommandPaletteProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: Command[] = [
    {
      id: 'new-task',
      label: 'Nova Tarefa',
      icon: <Plus className="w-4 h-4" />,
      action: () => {
        onNewTask?.();
        onClose();
      },
      keywords: ['nova', 'tarefa', 'criar', 'adicionar', 'task'],
    },
    {
      id: 'search',
      label: 'Pesquisar',
      icon: <Search className="w-4 h-4" />,
      action: () => {
        onSearch?.();
        onClose();
      },
      keywords: ['pesquisar', 'buscar', 'procurar', 'search'],
    },
    {
      id: 'calendar',
      label: 'Calendário',
      icon: <Calendar className="w-4 h-4" />,
      action: () => {
        onCalendar?.();
        onClose();
      },
      keywords: ['calendário', 'calendar', 'data'],
    },
    {
      id: 'users',
      label: 'Utilizadores',
      icon: <Users className="w-4 h-4" />,
      action: () => {
        onUsers?.();
        onClose();
      },
      keywords: ['utilizadores', 'users', 'pessoas', 'equipa'],
    },
    {
      id: 'settings',
      label: 'Definições',
      icon: <Settings className="w-4 h-4" />,
      action: () => {
        onSettings?.();
        onClose();
      },
      keywords: ['definições', 'settings', 'configurações'],
    },
  ];

  const filteredCommands = commands.filter((cmd) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(query) ||
      cmd.keywords?.some((keyword) => keyword.toLowerCase().includes(query))
    );
  });

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 pt-[20vh]">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4">
        <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Digite um comando ou pesquise..."
            className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400"
          />
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              Nenhum comando encontrado
            </div>
          ) : (
            <div className="py-2">
              {filteredCommands.map((cmd, index) => (
                <button
                  key={cmd.id}
                  onClick={() => {
                    cmd.action();
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    index === selectedIndex ? 'bg-gray-100 dark:bg-gray-700' : ''
                  }`}
                >
                  <div className="text-gray-400">{cmd.icon}</div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">{cmd.label}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center justify-between">
            <span>Use ↑↓ para navegar, Enter para selecionar, Esc para fechar</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;

