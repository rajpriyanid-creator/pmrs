import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { autoAssign, batchUpdateAssignments, getAllocationTable } from '../controllers/assignmentsController';
import { autoAssignPanels } from '../controllers/assignmentController';
import { writeLimiter } from '../middleware/rateLimiters';

const objectId = z.string().length(24);
const batchSchema = z.object({
  body: z.object({
    program: objectId,
    updates: z
      .array(
        z.object({
          teamId: objectId,
          guideId: objectId.nullable().optional(),
          coordinatorId: objectId.nullable().optional(),
          panelMemberIds: z.array(objectId).max(4).optional(),
        })
      )
      .min(1)
      .max(500),
  }),
  query: z.any(),
  params: z.any(),
});
const autoAssignSchema = z.object({
  body: z.object({ program: objectId }),
  query: z.any(),
  params: z.any(),
});

const router = Router();
router.use(requireAuth(), requireRole('admin'));

router.get('/', getAllocationTable);
router.patch('/batch', writeLimiter, validate(batchSchema), batchUpdateAssignments);
router.post('/auto-assign', writeLimiter, validate(autoAssignSchema), autoAssign);
router.post('/auto-assign-panels', writeLimiter, validate(autoAssignSchema), autoAssignPanels);

export default router;
