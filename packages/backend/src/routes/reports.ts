import { Router } from 'express';
import {
  getReports,
  getReportById,
  createReport,
  updateReport,
  deleteReport,
} from '../controllers/reportController';
import { createCustomReport, getWidgetTypes } from '../controllers/customReportController';
import { getWeeklySummary, sendWeeklySummaryEmail } from '../controllers/weeklySummaryController';
import { getForecast } from '../controllers/forecastController';
import { exportDataToCsv, exportDataToJson } from '../controllers/biExportController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getReports);
router.get('/widgets/types', authenticate, getWidgetTypes);
router.get('/weekly-summary', authenticate, getWeeklySummary);
router.get('/forecast/:metric', authenticate, getForecast);
router.get('/export/csv', authenticate, exportDataToCsv);
router.get('/export/json', authenticate, exportDataToJson);
router.post('/custom', authenticate, createCustomReport);
router.post('/weekly-summary/send-email', authenticate, sendWeeklySummaryEmail);
router.get('/:id', authenticate, getReportById);
router.post('/', authenticate, createReport);
router.put('/:id', authenticate, updateReport);
router.delete('/:id', authenticate, deleteReport);

export default router;

