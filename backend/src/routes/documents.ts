import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { listTemplates, generateLetter, previewLetter } from '../controllers/documentController';
import { writeLimiter } from '../middleware/rateLimiters';

const router = Router();
router.use(requireAuth());
router.use(requireRole('admin', 'coordinator', 'guide', 'panel', 'assistant'));

router.get('/templates', listTemplates);
router.get('/preview/:type', previewLetter);
router.get('/generate/:type', generateLetter);
router.post('/generate/:type', writeLimiter, generateLetter);

export default router;
