import { useState } from 'react';
import ReportExport from '../components/ReportExport';
import { FileText, Download } from 'lucide-react';

const ReportsPage = () => {
  const [filters, setFilters] = useState({
    status: '' as 'pending' | 'in_progress' | 'completed' | '',
    priority: '' as 'low' | 'medium' | 'high' | '',
    assignedTo: '',
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Relatórios</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Exportar relatórios de tarefas e utilizadores em PDF ou Excel
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Relatório de Tarefas */}
        <div className="card dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <FileText className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Relatório de Tarefas
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Exportar todas as tarefas
              </p>
            </div>
          </div>
          <ReportExport type="tasks" filters={filters} isAdmin={true} />
        </div>

        {/* Relatório de Utilizadores */}
        <div className="card dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <Download className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Relatório de Utilizadores
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Exportar lista de utilizadores
              </p>
            </div>
          </div>
          <ReportExport type="users" filters={filters} isAdmin={true} />
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;

