export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  created_at: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  created_by: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  deadline: Date | null;
  start_date?: Date | null;
  tags?: string[];
  parent_task_id?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: Date;
}

export interface TaskWithRelations extends Task {
  assigned_user?: {
    id: string;
    name: string;
    email: string;
  };
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
  created_at: Date;
}

export interface SubTask {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assigned_to: string | null;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'admin' | 'user';
}

