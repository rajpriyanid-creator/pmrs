import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createReviewPanel, getVivaPanel, listReviewPanels, updateVivaPanel } from '../controllers/panelsController';
import { writeLimiter } from '../middleware/rateLimiters';

const objectId = z.string().length(24);
const createReviewPanelSchema = z.object({
  body: z.object({
    program: objectId,
    coordinatorId: objectId,
    memberIds: z.array(objectId).max(4).optional(),
    teamIds: z.array(objectId).optional(),
  }),
  query: z.any(),
  params: z.any(),
});
const updateVivaSchema = z.object({
  body: z.object({
    externalMembers: z.array(
      z.object({ name: z.string().min(1).max(120), affiliation: z.string().min(1).max(160), email: z.string().email() })
    ),
  }),
  query: z.any(),
  params: z.object({ id: objectId }),
});

const router = Router();
router.use(requireAuth());

router.get('/review', requireRole('admin', 'assistant', 'coordinator', 'panel'), listReviewPanels);
router.post('/review', requireRole('admin'), writeLimiter, validate(createReviewPanelSchema), createReviewPanel);

router.get('/viva', requireRole('coordinator', 'admin'), getVivaPanel);
router.patch('/viva/:id', requireRole('coordinator'), writeLimiter, validate(updateVivaSchema), updateVivaPanel);

export default router;
