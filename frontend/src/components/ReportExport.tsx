import { useState } from 'react';
import { Download, FileText, FileSpreadsheet, Loader } from 'lucide-react';
import { reportService } from '../services/reportService';

interface ReportExportProps {
  type: 'tasks' | 'users';
  filters?: {
    status?: string;
    priority?: string;
    start_date?: string;
    end_date?: string;
  };
  isAdmin?: boolean;
}

const ReportExport = ({ type, filters, isAdmin = false }: ReportExportProps) => {
  const [loading, setLoading] = useState<'pdf' | 'excel' | null>(null);

  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      setLoading(format);
      let blob: Blob;
      let filename: string;

      if (type === 'tasks') {
        blob = await reportService.exportTasksReport(format, filters);
        filename = `relatorio-tarefas-${Date.now()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      } else {
        if (!isAdmin) return;
        blob = await reportService.exportUsersReport(format);
        filename = `relatorio-utilizadores-${Date.now()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      }

      reportService.downloadFile(blob, filename);
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Erro ao exportar relatório. Por favor, tente novamente.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleExport('pdf')}
        disabled={loading !== null}
        className="btn btn-secondary flex items-center gap-2"
        title="Exportar PDF"
      >
        {loading === 'pdf' ? (
          <Loader className="w-4 h-4 animate-spin" />
        ) : (
          <FileText className="w-4 h-4" />
        )}
        PDF
      </button>
      <button
        onClick={() => handleExport('excel')}
        disabled={loading !== null}
        className="btn btn-secondary flex items-center gap-2"
        title="Exportar Excel"
      >
        {loading === 'excel' ? (
          <Loader className="w-4 h-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="w-4 h-4" />
        )}
        Excel
      </button>
    </div>
  );
};

export default ReportExport;

