import { Request, Response } from 'express';
import { DesignationLimit } from '../models/DesignationLimit';

export async function getDesignationLimits(req: Request, res: Response) {
  try {
    const limits = await DesignationLimit.find().sort({ designation: 1 });
    res.json({ success: true, items: limits });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function createDesignationLimit(req: Request, res: Response) {
  try {
    const { designation, ugLimit, pgLimit } = req.body;
    if (!designation) {
      return res.status(400).json({ success: false, error: 'Designation is required' });
    }
    const limit = await DesignationLimit.create({
      designation: designation.trim(),
      ugLimit: Number(ugLimit) || 0,
      pgLimit: Number(pgLimit) || 0,
    });
    res.status(201).json({ success: true, item: limit });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function saveBatchDesignationLimits(req: Request, res: Response) {
  try {
    const { limits } = req.body;
    if (!Array.isArray(limits)) {
      return res.status(400).json({ success: false, error: 'Limits array required' });
    }
    for (const item of limits) {
      if (item.designation) {
        await DesignationLimit.findOneAndUpdate(
          { designation: item.designation.trim() },
          {
            ugLimit: Number(item.ugLimit) || 0,
            pgLimit: Number(item.pgLimit) || 0,
          },
          { upsert: true, new: true }
        );
      }
    }
    const updated = await DesignationLimit.find().sort({ designation: 1 });
    res.json({ success: true, items: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function deleteDesignationLimit(req: Request, res: Response) {
  try {
    await DesignationLimit.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Designation limit deleted' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function deleteAllDesignationLimits(req: Request, res: Response) {
  try {
    const result = await DesignationLimit.deleteMany({});
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function downloadDesignationLimitsTemplate(req: Request, res: Response) {
  const csvContent = 'Designation,UG Limit,PG Limit\nProfessor,4,2\nAssociate Professor,3,2\nAssistant Professor,2,1\n';
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="designation-limits-template.csv"');
  res.send(csvContent);
}

export async function importDesignationLimits(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file provided' });
    }
    const content = req.file.buffer.toString('utf-8');
    const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length <= 1) {
      return res.status(400).json({ success: false, error: 'File is empty or missing headers' });
    }
    let count = 0;
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim());
      if (parts.length >= 3 && parts[0]) {
        await DesignationLimit.findOneAndUpdate(
          { designation: parts[0] },
          {
            ugLimit: Number(parts[1]) || 0,
            pgLimit: Number(parts[2]) || 0,
          },
          { upsert: true }
        );
        count++;
      }
    }
    res.json({ success: true, createdCount: count });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}
