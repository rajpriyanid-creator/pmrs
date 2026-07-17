import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import {
  submitAvailability,
  listAvailability,
  deleteAvailabilitySlot,
  generateSchedules,
  generateSlotForTeam,
  generateSlotsForCoordinator,
  listScheduledSlots,
  clearSchedules,
  deleteAllottedSlot,
} from '../controllers/schedulingController';
import { writeLimiter } from '../middleware/rateLimiters';

const router = Router();
router.use(requireAuth());

// Availability slot submission (guide/panel/coordinator submit their own availability)
router.get('/availability', requireRole('admin', 'coordinator'), listAvailability);
router.post('/availability', requireRole('guide', 'panel', 'coordinator'), writeLimiter, submitAvailability);
router.delete('/availability/:id', writeLimiter, deleteAvailabilitySlot);

// Scheduled slots listing (all authenticated users can see their own scope)
router.get('/slots', listScheduledSlots);

// Auto-generate schedule (admin or coordinator)
router.post('/generate', requireRole('admin', 'coordinator'), writeLimiter, generateSchedules);
router.post('/generate/coordinator', requireRole('coordinator'), writeLimiter, generateSlotsForCoordinator);
router.post('/generate/team', requireRole('admin', 'coordinator'), writeLimiter, generateSlotForTeam);

// Bulk clear and single delete
router.delete('/slots', requireRole('admin', 'coordinator'), writeLimiter, clearSchedules);
router.delete('/slots/:id', requireRole('admin', 'coordinator'), writeLimiter, deleteAllottedSlot);

export default router;
