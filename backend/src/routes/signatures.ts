import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { listSignatures, getSignature, createSignature, updateSignature, deleteSignature } from '../controllers/signatureController';
import { writeLimiter } from '../middleware/rateLimiters';

const router = Router();
router.use(requireAuth());
router.use(requireRole('admin', 'coordinator'));

router.get('/', listSignatures);
router.get('/:id', getSignature);
router.post('/', writeLimiter, createSignature);
router.patch('/:id', writeLimiter, updateSignature);
router.delete('/:id', writeLimiter, deleteSignature);

export default router;
