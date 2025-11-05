import { useState } from 'react';
import { Plus, X, FileText, Users, Tag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface QuickActionsProps {
  onNewTask: () => void;
  onNewTemplate?: () => void;
  onNewTag?: () => void;
}

const QuickActions = ({ onNewTask, onNewTemplate, onNewTag }: QuickActionsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAdmin } = useAuth();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
      <div className="fixed bottom-6 right-6 z-50">
        {isOpen && (
          <div className="absolute bottom-16 right-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[200px]">
            <button
              onClick={() => {
                onNewTask();
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
            >
              <FileText className="w-5 h-5 text-primary-600" />
              <span className="text-sm font-medium text-gray-900">Nova Tarefa</span>
            </button>
            {isAdmin && onNewTemplate && (
              <button
                onClick={() => {
                  onNewTemplate();
                  setIsOpen(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
              >
                <FileText className="w-5 h-5 text-primary-600" />
                <span className="text-sm font-medium text-gray-900">Novo Template</span>
              </button>
            )}
            {isAdmin && onNewTag && (
              <button
                onClick={() => {
                  onNewTag();
                  setIsOpen(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
              >
                <Tag className="w-5 h-5 text-primary-600" />
                <span className="text-sm font-medium text-gray-900">Nova Etiqueta</span>
              </button>
            )}
          </div>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-all flex items-center justify-center ${
            isOpen ? 'rotate-45' : 'rotate-0'
          }`}
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </>
  );
};

export default QuickActions;

