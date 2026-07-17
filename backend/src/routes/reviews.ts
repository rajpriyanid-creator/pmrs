import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createReview, listReviews, updateReview } from '../controllers/reviewsController';
import { writeLimiter } from '../middleware/rateLimiters';

const objectId = z.string().length(24);
const createSchema = z.object({
  body: z.object({
    teamId: objectId,
    type: z.enum(['review0', 'review1', 'review2', 'review3', 'viva']),
    scheduledDate: z.string().datetime().optional(),
    scheduledTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
    durationMinutes: z.number().int().min(5).max(240).optional(),
  }),
  query: z.any(),
  params: z.any(),
});
const updateSchema = z.object({
  body: z.object({
    scheduledDate: z.string().datetime().optional(),
    scheduledTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
    durationMinutes: z.number().int().min(5).max(240).optional(),
    closed: z.boolean().optional(),
  }),
  query: z.any(),
  params: z.object({ id: objectId }),
});

const router = Router();
router.use(requireAuth());

router.get('/', listReviews);
router.post('/', requireRole('coordinator', 'admin'), writeLimiter, validate(createSchema), createReview);
router.patch('/:id', requireRole('coordinator'), writeLimiter, validate(updateSchema), updateReview);

export default router;
