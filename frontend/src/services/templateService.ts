import api from './api';
import { TaskTemplate } from '../types';

export const templateService = {
  async getTemplates(): Promise<TaskTemplate[]> {
    const response = await api.get<{ templates: TaskTemplate[] }>('/templates');
    return response.data.templates;
  },

  async createTemplate(data: {
    name: string;
    description?: string;
    title: string;
    default_description?: string;
    default_priority?: 'low' | 'medium' | 'high';
    default_tags?: string[];
  }): Promise<TaskTemplate> {
    const response = await api.post<{ template: TaskTemplate }>('/templates', data);
    return response.data.template;
  },

  async deleteTemplate(id: string): Promise<void> {
    await api.delete(`/templates/${id}`);
  },
};

