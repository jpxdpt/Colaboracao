import api from './api';
import { Notification } from '../types';

export const notificationService = {
  async getNotifications(unreadOnly?: boolean): Promise<Notification[]> {
    const response = await api.get<{ notifications: Notification[] }>('/notifications', {
      params: { unread_only: unreadOnly ? 'true' : undefined },
    });
    return response.data.notifications;
  },

  async getUnreadCount(): Promise<number> {
    const response = await api.get<{ count: number }>('/notifications/unread-count');
    return response.data.count;
  },

  async markAsRead(id: string): Promise<void> {
    await api.put(`/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await api.put('/notifications/read-all');
  },
};

