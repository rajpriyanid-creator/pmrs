import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createGuideRequest, getGuideLimits, listGuideRequests, respondToGuideRequest } from '../controllers/guideRequestsController';
import { writeLimiter } from '../middleware/rateLimiters';

const objectId = z.string().length(24);
const createSchema = z.object({
  body: z.object({ teamId: objectId, guideId: objectId }),
  query: z.any(),
  params: z.any(),
});
const respondSchema = z.object({
  body: z.object({ accept: z.boolean() }),
  query: z.any(),
  params: z.object({ id: objectId }),
});

const router = Router();
router.use(requireAuth());

router.post('/', requireRole('student'), writeLimiter, validate(createSchema), createGuideRequest);
router.get('/', requireRole('guide', 'admin'), listGuideRequests);
router.patch('/:id', requireRole('guide'), writeLimiter, validate(respondSchema), respondToGuideRequest);
router.get('/limits', requireRole('guide', 'admin'), getGuideLimits);

export default router;
