import api from './api';
import { Tag } from '../types';

export const tagService = {
  async getTags(): Promise<Tag[]> {
    const response = await api.get<{ tags: Tag[] }>('/tags');
    return response.data.tags;
  },

  async createTag(data: { name: string; color?: string }): Promise<Tag> {
    const response = await api.post<{ tag: Tag }>('/tags', data);
    return response.data.tag;
  },

  async deleteTag(id: string): Promise<void> {
    await api.delete(`/tags/${id}`);
  },
};

