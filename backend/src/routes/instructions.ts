import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import {
  getInstructions,
  createInstruction,
  deleteInstruction,
  downloadInstructionFile,
} from '../controllers/instructionController';
import multer from 'multer';
import path from 'path';
import { env } from '../config/env';
import { writeLimiter } from '../middleware/rateLimiters';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, env.UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `instruction-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });

const router = Router();
router.use(requireAuth());

router.get('/', getInstructions);
router.get('/:id/download', downloadInstructionFile);
router.post('/', requireRole('coordinator', 'admin'), writeLimiter, upload.single('file'), createInstruction);
router.delete('/:id', requireRole('coordinator', 'admin'), writeLimiter, deleteInstruction);

export default router;
