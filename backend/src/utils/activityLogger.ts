import ActivityLog from '../models/ActivityLog.js';
import { Types } from 'mongoose';

interface LogActivityParams {
  taskId: Types.ObjectId | string;
  userId: Types.ObjectId | string;
  action: 'created' | 'updated' | 'deleted' | 'status_changed' | 'assigned' | 'comment_added';
  field?: string;
  oldValue?: any;
  newValue?: any;
}

export const logActivity = async ({
  taskId,
  userId,
  action,
  field,
  oldValue,
  newValue,
}: LogActivityParams) => {
  try {
    await ActivityLog.create({
      task_id: typeof taskId === 'string' ? new Types.ObjectId(taskId) : taskId,
      user_id: typeof userId === 'string' ? new Types.ObjectId(userId) : userId,
      action,
      field,
      old_value: oldValue,
      new_value: newValue,
    });
  } catch (error) {
    console.error('Error logging activity:', error);
    // Não falhar a operação principal se o log falhar
  }
};

export const getActivityLogs = async (taskId: string) => {
  return await ActivityLog.find({ task_id: taskId })
    .populate('user_id', 'name email')
    .sort({ created_at: -1 })
    .lean();
};

