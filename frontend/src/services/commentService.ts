import api from './api';
import { Comment } from '../types';

export const commentService = {
  async getComments(taskId: string): Promise<Comment[]> {
    const response = await api.get<{ comments: Comment[] }>(`/comments/task/${taskId}`);
    return response.data.comments;
  },

  async createComment(taskId: string, content: string): Promise<Comment> {
    const response = await api.post<{ comment: Comment }>('/comments', {
      task_id: taskId,
      content,
    });
    return response.data.comment;
  },

  async deleteComment(id: string): Promise<void> {
    await api.delete(`/comments/${id}`);
  },
};

