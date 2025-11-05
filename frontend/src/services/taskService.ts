import api from './api';
import { Task, TaskWithRelations } from '../types';

export const taskService = {
  async getTasks(params?: {
    status?: 'pending' | 'in_progress' | 'completed';
    priority?: 'low' | 'medium' | 'high';
    assigned_to?: string[];
    tags?: string;
    search?: string;
    parent_task_id?: string;
  }): Promise<TaskWithRelations[]> {
    const response = await api.get<{ tasks: TaskWithRelations[] }>('/tasks', { params });
    return response.data.tasks;
  },

  async getTask(id: string): Promise<TaskWithRelations> {
    const response = await api.get<{ task: TaskWithRelations }>(`/tasks/${id}`);
    return response.data.task;
  },

  async createTask(data: {
    title: string;
    description?: string;
    assigned_to?: string[];
    priority?: 'low' | 'medium' | 'high';
    deadline?: string;
    start_date?: string;
    tags?: string[];
    parent_task_id?: string;
  }): Promise<Task> {
    const response = await api.post<{ task: Task }>('/tasks', data);
    return response.data.task;
  },

  async updateTask(
    id: string,
    data: {
      title?: string;
      description?: string;
      assigned_to?: string[];
      status?: 'pending' | 'in_progress' | 'completed';
      priority?: 'low' | 'medium' | 'high';
      deadline?: string;
      start_date?: string;
      tags?: string[];
    }
  ): Promise<Task> {
    const response = await api.put<{ task: Task }>(`/tasks/${id}`, data);
    return response.data.task;
  },

  async deleteTask(id: string): Promise<void> {
    await api.delete(`/tasks/${id}`);
  },
};

