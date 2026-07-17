import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import {
  getConfig,
  updateConfig,
  deleteAllTeams,
  deleteAllSoloTeams,
  deleteAllStudents,
  deleteAllFaculty,
  deleteUser,
} from '../controllers/adminConfigController';
import { writeLimiter } from '../middleware/rateLimiters';

const router = Router();
router.use(requireAuth());
router.use(requireRole('admin'));

router.get('/', getConfig);
router.patch('/', writeLimiter, updateConfig);

// Danger Zone
router.delete('/danger/all-teams', writeLimiter, deleteAllTeams);
router.delete('/danger/solo-teams', writeLimiter, deleteAllSoloTeams);
router.delete('/danger/all-students', writeLimiter, deleteAllStudents);
router.delete('/danger/all-faculty', writeLimiter, deleteAllFaculty);
router.delete('/danger/user/:id', writeLimiter, deleteUser);

export default router;
