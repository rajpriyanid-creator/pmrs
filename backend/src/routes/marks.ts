import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  exportMarks,
  getMarksForReview,
  getMarksSummary,
  submitMarks,
  submitMarksForTeam,
} from '../controllers/marksController';
import { writeLimiter } from '../middleware/rateLimiters';

const objectId = z.string().length(24);

// Per-student rubric submit schema
const submitSchema = z.object({
  body: z.object({
    teamId: objectId,
    reviewId: objectId,
    studentId: objectId,
    mark1: z.number().min(0).max(10),
    mark2: z.number().min(0).max(10),
    mark3: z.number().min(0).max(10),
    mark4: z.number().min(0).max(10),
    confirm: z.boolean(),
  }),
  query: z.any(),
  params: z.any(),
});

// Bulk-submit for all students in a team
const bulkSubmitSchema = z.object({
  body: z.object({
    teamId: objectId,
    reviewId: objectId,
    studentMarks: z.array(
      z.object({
        studentId: objectId,
        mark1: z.number().min(0).max(10),
        mark2: z.number().min(0).max(10),
        mark3: z.number().min(0).max(10),
        mark4: z.number().min(0).max(10),
      })
    ).min(1),
    confirm: z.boolean(),
  }),
  query: z.any(),
  params: z.any(),
});

const router = Router();
router.use(requireAuth());

router.get('/', getMarksForReview);
router.get('/export', requireRole('admin', 'coordinator', 'guide', 'panel', 'assistant'), exportMarks);
router.get('/summary/:teamId', getMarksSummary);
router.post('/', requireRole('guide', 'panel'), writeLimiter, validate(submitSchema), submitMarks);
router.post('/bulk', requireRole('guide', 'panel'), writeLimiter, validate(bulkSubmitSchema), submitMarksForTeam);

export default router;
