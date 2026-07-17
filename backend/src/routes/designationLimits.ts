import { Router } from 'express';
import multer from 'multer';
import { requireAuth, requireRole } from '../middleware/auth';
import {
  getDesignationLimits,
  createDesignationLimit,
  saveBatchDesignationLimits,
  deleteDesignationLimit,
  deleteAllDesignationLimits,
  downloadDesignationLimitsTemplate,
  importDesignationLimits,
} from '../controllers/designationLimitController';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.use(requireAuth, requireRole('admin'));

router.get('/', getDesignationLimits);
router.post('/', createDesignationLimit);
router.post('/batch', saveBatchDesignationLimits);
router.get('/template', downloadDesignationLimitsTemplate);
router.post('/import', upload.single('file'), importDesignationLimits);
router.delete('/:id', deleteDesignationLimit);
router.delete('/', deleteAllDesignationLimits);

export default router;
