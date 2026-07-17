import { Request, Response } from 'express';
import { Signature } from '../models/Signature';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

/** GET /signatures — list signatures for the current user (or all for admin). */
export const listSignatures = asyncHandler(async (req: Request, res: Response) => {
  const auth = req.auth!;
  const filter = auth.role === 'admin' ? {} : { ownerId: auth.userId };
  const signatures = await Signature.find(filter).select('-imageBase64').lean();
  res.json({ signatures });
});

/** GET /signatures/:id — get a single signature (including image). */
export const getSignature = asyncHandler(async (req: Request, res: Response) => {
  const sig = await Signature.findById(req.params.id);
  if (!sig) throw ApiError.notFound('Signature not found');
  const auth = req.auth!;
  if (auth.role !== 'admin' && sig.ownerId.toString() !== auth.userId) {
    throw ApiError.forbidden('Access denied');
  }
  res.json({ signature: sig });
});

/** POST /signatures — upload a new signature image. */
export const createSignature = asyncHandler(async (req: Request, res: Response) => {
  const { imageBase64, filename, role: sigRole, label } = req.body as {
    imageBase64: string;
    filename?: string;
    role?: string;
    label?: string;
  };
  if (!imageBase64) throw ApiError.badRequest('imageBase64 is required');
  if (imageBase64.length > 3 * 1024 * 1024) throw ApiError.badRequest('Signature image too large (max ~2 MB base64)');

  const sig = await Signature.create({
    ownerId: req.auth!.userId,
    ownerModel: 'Faculty',
    role: label || sigRole || req.auth!.role || 'Signature',
    label: label || sigRole || 'Signature',
    imageBase64,
    filename: filename || 'signature.png',
  });
  res.status(201).json({ signature: sig });
});

/** PATCH /signatures/:id — update signature image or filename. */
export const updateSignature = asyncHandler(async (req: Request, res: Response) => {
  const sig = await Signature.findById(req.params.id);
  if (!sig) throw ApiError.notFound('Signature not found');
  const auth = req.auth!;
  if (auth.role !== 'admin' && sig.ownerId.toString() !== auth.userId) {
    throw ApiError.forbidden('Access denied');
  }
  const { imageBase64, filename } = req.body;
  if (imageBase64) sig.imageBase64 = imageBase64;
  if (filename) sig.filename = filename;
  await sig.save();
  res.json({ signature: { ...sig.toObject(), imageBase64: undefined } });
});

/** DELETE /signatures/:id — delete a signature. */
export const deleteSignature = asyncHandler(async (req: Request, res: Response) => {
  const sig = await Signature.findById(req.params.id);
  if (!sig) throw ApiError.notFound('Signature not found');
  const auth = req.auth!;
  if (auth.role !== 'admin' && sig.ownerId.toString() !== auth.userId) {
    throw ApiError.forbidden('Access denied');
  }
  await Signature.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});
