import axios from 'axios';
import { Attachment } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  };
};

export const attachmentService = {
  // Listar anexos de uma tarefa
  getAttachments: async (taskId: string): Promise<Attachment[]> => {
    const response = await axios.get(`${API_URL}/attachments/task/${taskId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data.attachments;
  },

  // Upload de anexo
  uploadAttachment: async (taskId: string, file: File): Promise<Attachment> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(
      `${API_URL}/attachments/task/${taskId}`,
      formData,
      getAuthHeaders()
    );
    return response.data.attachment;
  },

  // Download de anexo
  downloadAttachment: async (attachmentId: string): Promise<Blob> => {
    const response = await axios.get(
      `${API_URL}/attachments/${attachmentId}/download`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        responseType: 'blob',
      }
    );
    return response.data;
  },

  // Eliminar anexo
  deleteAttachment: async (attachmentId: string): Promise<void> => {
    await axios.delete(`${API_URL}/attachments/${attachmentId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
  },

  // Formatar tamanho de ficheiro
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  },
};

