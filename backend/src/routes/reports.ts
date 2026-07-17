import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { uploadReport, listReports, downloadReport, approveReport, rejectReport } from '../controllers/reportsController';
import multer from 'multer';
import path from 'path';
import { env } from '../config/env';
import { writeLimiter } from '../middleware/rateLimiters';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, env.UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `report-${Date.now()}${ext}`);
  },
});
const reportUpload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.zip'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only PDF, Word, and ZIP files are allowed'));
  },
});

const router = Router();
router.use(requireAuth());

router.get('/', listReports);
router.post('/upload', writeLimiter, reportUpload.single('report'), uploadReport);
router.get('/:id/download', downloadReport);
router.patch('/:id/approve', requireRole('guide'), writeLimiter, approveReport);
router.patch('/:id/reject', requireRole('guide'), writeLimiter, rejectReport);

export default router;
