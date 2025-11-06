import axios from 'axios';
import { TimeEntry } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const timeEntryService = {
  // Listar entradas de tempo
  getTimeEntries: async (filters?: {
    task_id?: string;
    user_id?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<TimeEntry[]> => {
    const params = new URLSearchParams();
    if (filters?.task_id) params.append('task_id', filters.task_id);
    if (filters?.user_id) params.append('user_id', filters.user_id);
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);

    const response = await axios.get(
      `${API_URL}/time-entries?${params.toString()}`,
      getAuthHeaders()
    );
    return response.data.timeEntries;
  },

  // Criar entrada de tempo
  createTimeEntry: async (data: {
    task_id: string;
    start_time?: string;
    end_time?: string;
    description?: string;
  }): Promise<TimeEntry> => {
    const response = await axios.post(`${API_URL}/time-entries`, data, getAuthHeaders());
    return response.data.timeEntry;
  },

  // Atualizar entrada de tempo
  updateTimeEntry: async (id: string, data: { end_time?: string; description?: string }): Promise<TimeEntry> => {
    const response = await axios.put(`${API_URL}/time-entries/${id}`, data, getAuthHeaders());
    return response.data.timeEntry;
  },

  // Eliminar entrada de tempo
  deleteTimeEntry: async (id: string): Promise<void> => {
    await axios.delete(`${API_URL}/time-entries/${id}`, getAuthHeaders());
  },

  // Obter resumo de tempo por tarefa
  getTaskTimeSummary: async (taskId: string): Promise<{
    total_entries: number;
    total_minutes: number;
    total_hours: number;
    remaining_minutes: number;
    formatted_time: string;
  }> => {
    const response = await axios.get(
      `${API_URL}/time-entries/task/${taskId}/summary`,
      getAuthHeaders()
    );
    return response.data.summary;
  },

  // Formatar tempo
  formatTime: (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  },
};

