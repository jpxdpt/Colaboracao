import { Router } from 'express';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getSubtasks,
} from '../controllers/taskController';
import { getRecommendedTasks } from '../controllers/taskRecommendationController';
import { getTaskTemplates, createTaskFromTemplate } from '../controllers/taskTemplateController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getTasks);
router.get('/recommended', authenticate, getRecommendedTasks);
router.get('/templates', authenticate, getTaskTemplates);
router.post('/templates/:templateName', authenticate, createTaskFromTemplate);
router.get('/:id/subtasks', authenticate, getSubtasks);
router.get('/:id', authenticate, getTaskById);
router.post('/', authenticate, createTask);
router.put('/:id', authenticate, updateTask);
router.delete('/:id', authenticate, deleteTask);

export default router;

