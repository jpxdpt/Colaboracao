import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const reportService = {
  // Exportar relatório de tarefas
  exportTasksReport: async (
    format: 'pdf' | 'excel',
    filters?: {
      status?: string;
      priority?: string;
      start_date?: string;
      end_date?: string;
    }
  ): Promise<Blob> => {
    const params = new URLSearchParams({ format });
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);

    const response = await axios.get(`${API_URL}/reports/tasks?${params.toString()}`, {
      ...getAuthHeaders(),
      responseType: 'blob',
    });

    return response.data;
  },

  // Exportar relatório de utilizadores (apenas admin)
  exportUsersReport: async (format: 'pdf' | 'excel'): Promise<Blob> => {
    const response = await axios.get(`${API_URL}/reports/users?format=${format}`, {
      ...getAuthHeaders(),
      responseType: 'blob',
    });

    return response.data;
  },

  // Download de ficheiro
  downloadFile: (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};

