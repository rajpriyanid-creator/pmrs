import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createStudent, getGuideAvailability, importStudentsCsv, listStudents } from '../controllers/studentsController';
import { excelUpload } from '../middleware/upload';
import { writeLimiter } from '../middleware/rateLimiters';

const objectId = z.string().length(24);
const createSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(120),
    rollNo: z.string().min(1).max(30),
    program: objectId,
    email: z.string().email(),
    username: z.string().min(3).max(60).regex(/^[a-z0-9._-]+$/i),
  }),
  query: z.any(),
  params: z.any(),
});

const router = Router();
router.use(requireAuth());

router.get('/', requireRole('admin', 'assistant'), listStudents);
router.get('/guides', requireRole('student'), getGuideAvailability);
router.post('/', requireRole('admin'), writeLimiter, validate(createSchema), createStudent);
router.post('/import', requireRole('admin'), writeLimiter, excelUpload, importStudentsCsv);

export default router;
