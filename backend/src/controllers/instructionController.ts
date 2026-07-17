import { Request, Response } from 'express';
import { InstructionTemplate } from '../models/InstructionTemplate';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import path from 'path';
import fs from 'fs';

/** GET /instructions — get instruction templates for a program. */
export const getInstructions = asyncHandler(async (req: Request, res: Response) => {
  const { program } = req.query as { program?: string };
  const filter: Record<string, unknown> = {};
  if (program) filter.program = program;

  const instructions = await InstructionTemplate.find(filter)
    .populate('uploadedBy', 'name email')
    .sort({ createdAt: -1 })
    .lean();

  res.json({ instructions });
});

/** POST /instructions — coordinator/admin uploads instructions with optional file. */
export const createInstruction = asyncHandler(async (req: Request, res: Response) => {
  const { program, title, instructions } = req.body as { program: string; title: string; instructions?: string };
  if (!program || !title) throw ApiError.badRequest('program and title are required');

  const file = req.file;

  const doc = await InstructionTemplate.create({
    program,
    title,
    instructions: instructions || '',
    filePath: file ? file.path : '',
    fileName: file ? file.originalname : '',
    uploadedBy: req.auth!.userId,
  });

  res.status(201).json({ instruction: doc });
});

/** DELETE /instructions/:id — coordinator/admin deletes an instruction. */
export const deleteInstruction = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const doc = await InstructionTemplate.findById(id);
  if (!doc) throw ApiError.notFound('Instruction not found');

  if (doc.filePath) {
    try { fs.unlinkSync(doc.filePath); } catch { /* ignore */ }
  }

  await InstructionTemplate.findByIdAndDelete(id);
  res.json({ ok: true, message: 'Instruction deleted' });
});

/** GET /instructions/:id/download — download instruction fileAttachment. */
export const downloadInstructionFile = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const doc = await InstructionTemplate.findById(id);
  if (!doc || !doc.filePath) throw ApiError.notFound('Instruction file not found');

  const absolutePath = path.isAbsolute(doc.filePath)
    ? doc.filePath
    : path.resolve(process.cwd(), doc.filePath);

  if (!fs.existsSync(absolutePath)) {
    throw ApiError.notFound('File not found on disk');
  }

  res.download(absolutePath, doc.fileName || 'instruction-attachment');
});
