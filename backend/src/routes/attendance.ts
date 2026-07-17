import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { exportAttendance, getAttendance, submitAttendance } from '../controllers/attendanceController';
import { writeLimiter } from '../middleware/rateLimiters';

const objectId = z.string().length(24);
const submitSchema = z.object({
  body: z.object({
    reviewId: objectId.nullable(),
    kind: z.enum(['review', 'semester']),
    perStudent: z.array(z.object({ studentId: objectId, present: z.boolean() })).min(1),
    reviewDate: z.string().datetime().optional(),
    reviewTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
      .optional(),
  }),
  query: z.any(),
  params: z.object({ teamId: objectId }),
});

const router = Router();
router.use(requireAuth());

// Admin sees the identical, read-only mirror via the same GET — no separate
// stripped-down endpoint (spec 13.1) — enforcement is simply "no write route for admin".
router.get('/', getAttendance);
router.get('/export', requireRole('admin', 'coordinator', 'guide', 'panel', 'assistant'), exportAttendance);
router.post('/:teamId/submit', requireRole('coordinator'), writeLimiter, validate(submitSchema), submitAttendance);

export default router;
