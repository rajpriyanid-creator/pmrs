import { Router } from 'express';
import { Program } from '../models/Program';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { cacheWrap } from '../services/cacheService';

const router = Router();

router.get(
  '/',
  requireAuth(),
  asyncHandler(async (_req, res) => {
    const programs = await cacheWrap('programs:all', 300, () => Program.find().sort({ type: 1, name: 1 }).lean());
    res.json({ programs });
  })
);

export default router;
