import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createFacultySchema, updateFacultySchema } from './faculty.schemas';
import {
  createFaculty,
  exportFacultyList,
  exportFacultyTemplate,
  importFacultyCsv,
  listFaculty,
  updateFaculty,
} from '../controllers/facultyController';
import { excelUpload } from '../middleware/upload';
import { writeLimiter } from '../middleware/rateLimiters';

const router = Router();

router.use(requireAuth());

router.get('/', requireRole('admin', 'assistant'), listFaculty);
router.get('/export/template', requireRole('admin'), exportFacultyTemplate);
router.get('/export', requireRole('admin', 'assistant'), exportFacultyList);
router.post('/', requireRole('admin'), writeLimiter, validate(createFacultySchema), createFaculty);
router.post('/import', requireRole('admin'), writeLimiter, excelUpload, importFacultyCsv);
router.patch('/:id', requireRole('admin'), writeLimiter, validate(updateFacultySchema), updateFaculty);

export default router;
