import { Router } from 'express';
import multer from 'multer';
import { Program } from '../models/Program';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.get(
  '/',
  requireAuth(),
  asyncHandler(async (_req, res) => {
    const programs = await Program.find().sort({ type: 1, name: 1 }).lean();
    res.json({ programs });
  })
);

router.post(
  '/',
  requireAuth(),
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const { name, code, type, maxTeamSize } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, error: 'Name and Code are required' });
    }
    const program = await Program.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      type: type === 'UG' ? 'UG' : 'PG',
      maxTeamSize: Number(maxTeamSize) || 4,
    });
    res.status(201).json({ success: true, program });
  })
);

router.patch(
  '/:id',
  requireAuth(),
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const { name, code, type, maxTeamSize } = req.body;
    const updates: Record<string, unknown> = {};
    if (name) updates.name = name.trim();
    if (code) updates.code = code.trim().toUpperCase();
    if (type) updates.type = type;
    if (maxTeamSize) updates.maxTeamSize = Number(maxTeamSize);

    const program = await Program.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!program) {
      return res.status(404).json({ success: false, error: 'Programme not found' });
    }
    res.json({ success: true, program });
  })
);

router.delete(
  '/:id',
  requireAuth(),
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    await Program.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Programme deleted' });
  })
);

router.get(
  '/template',
  requireAuth(),
  requireRole('admin'),
  asyncHandler(async (_req, res) => {
    const csvContent = 'Name,Code,Type,Max Team Size\nM.E. Data Science,MEDS,PG,4\nM.E. Cyber Security,MECS,PG,4\n';
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="programme-template.csv"');
    res.send(csvContent);
  })
);

router.post(
  '/import',
  requireAuth(),
  requireRole('admin'),
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    const content = req.file.buffer.toString('utf-8');
    const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
    let count = 0;
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim());
      if (parts.length >= 2 && parts[0] && parts[1]) {
        await Program.findOneAndUpdate(
          { code: parts[1].toUpperCase() },
          {
            name: parts[0],
            code: parts[1].toUpperCase(),
            type: parts[2] === 'UG' ? 'UG' : 'PG',
            maxTeamSize: Number(parts[3]) || 4,
          },
          { upsert: true }
        );
        count++;
      }
    }
    res.json({ success: true, createdCount: count });
  })
);

export default router;
