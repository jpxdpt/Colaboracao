export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string[];
  created_by: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  deadline: string | null;
  start_date?: string | null;
  tags?: string[];
  parent_task_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

export interface TaskWithRelations extends Task {
  assigned_users?: {
    id: string;
    name: string;
    email: string;
  }[];
  assigned_user?: {
    id: string;
    name: string;
    email: string;
  }; // Mantido para compatibilidade
  created_by_user?: {
    id: string;
    name: string;
    email: string;
  };
  parent_task?: {
    id: string;
    title: string;
  };
  comments?: Comment[];
  activity_logs?: ActivityLog[];
  subtasks?: SubTask[];
}

export interface ActivityLog {
  id: string;
  task_id: string;
  user_id: string;
  user_name?: string;
  action: 'created' | 'updated' | 'deleted' | 'status_changed' | 'assigned' | 'comment_added';
  field?: string;
  old_value?: any;
  new_value?: any;
  created_at: string;
}

export interface SubTask {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assigned_to: string | null;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  created_by: string;
  created_at: string;
}

export interface Notification {
  id: string;
  task_id: string | null;
  task_title: string | null;
  type: 'task_assigned' | 'task_updated' | 'task_overdue' | 'comment_added' | 'deadline_approaching';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface TaskTemplate {
  id: string;
  name: string;
  description?: string;
  title: string;
  default_description?: string;
  default_priority: 'low' | 'medium' | 'high';
  default_tags?: string[];
  created_by: string;
  created_at: string;
}

export interface Attachment {
  id: string;
  task_id: string;
  user_id: string;
  user_name: string;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  created_at: string;
  download_url: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}

export interface TimeEntry {
  id: string;
  task_id: string;
  task_title: string;
  user_id: string;
  user_name: string;
  start_time: string;
  end_time: string | null;
  duration: number; // em minutos
  description: string | null;
  created_at: string;
  updated_at: string;
}

