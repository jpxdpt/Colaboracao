import api from './api';
import { User } from '../types';

export const userService = {
  async getUsers(): Promise<User[]> {
    const response = await api.get<{ users: User[] }>('/users');
    return response.data.users;
  },

  async getUserStats(): Promise<{
    total_users: number;
    total_admins: number;
    total_regular_users: number;
    tasks_by_user: Array<{
      id: number;
      name: string;
      email: string;
      total_tasks: string;
      completed_tasks: string;
      pending_tasks: string;
      in_progress_tasks: string;
    }>;
  }> {
    const response = await api.get('/users/stats');
    return response.data;
  },

  async updateUserRole(id: string, role: 'admin' | 'user'): Promise<User> {
    const response = await api.put<{ user: User }>(`/users/${id}/role`, { role });
    return response.data.user;
  },

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },
};

