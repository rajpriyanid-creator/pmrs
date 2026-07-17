import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { listNotifications, markNotificationRead } from '../controllers/notificationsController';

const router = Router();
router.use(requireAuth());

router.get('/', listNotifications);
router.patch('/:id/read', markNotificationRead);

export default router;
