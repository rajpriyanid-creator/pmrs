import { Request, Response } from 'express';
import { ReviewPanel, VivaPanel } from '../models/Panel';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { recordAudit } from '../services/auditService';
import { cacheInvalidatePrefix } from '../services/cacheService';

export const listReviewPanels = asyncHandler(async (req: Request, res: Response) => {
  const program = req.query.program as string;
  const filter: Record<string, unknown> = program ? { program } : {};
  if (req.auth!.role === 'coordinator') {
    filter.coordinatorId = req.auth!.userId; // coordinators only ever see their own panel
  } else if (req.auth!.role === 'panel') {
    filter.memberIds = req.auth!.userId;
  }
  const panels = await ReviewPanel.find(filter).populate('memberIds', 'name').populate('coordinatorId', 'name').lean();
  res.json({ panels });
});

export const createReviewPanel = asyncHandler(async (req: Request, res: Response) => {
  const { program, coordinatorId, memberIds, teamIds } = req.body;
  if (memberIds && memberIds.length > 4) throw ApiError.badRequest('Review panels are capped at 4 members');

  const panel = await ReviewPanel.create({ program, coordinatorId, memberIds: memberIds ?? [], teamIds: teamIds ?? [] });
  await cacheInvalidatePrefix(`allocations:${program}`);
  await recordAudit(req.auth!, 'create', 'ReviewPanel', panel._id, {});
  res.status(201).json({ panel });
});

/** GET /panels/viva — prefilled with the coordinator's own Review Panel internal members (locked). */
export const getVivaPanel = asyncHandler(async (req: Request, res: Response) => {
  const coordinatorId = (req.query.coordinatorId as string) || req.auth!.userId;
  if (req.auth!.role === 'coordinator' && coordinatorId !== req.auth!.userId) {
    throw ApiError.forbidden('Coordinators may only view their own viva panel');
  }

  let viva = await VivaPanel.findOne({ coordinatorId, program: req.auth!.programId })
    .populate('internalMembers', 'name')
    .lean();

  if (!viva) {
    // Auto-derive the prefilled/locked internal member set from this
    // coordinator's existing Review Panel(s) — spec 6.8.
    const reviewPanels = await ReviewPanel.find({ coordinatorId, program: req.auth!.programId }).lean();
    const internalMemberIds = new Set<string>();
    internalMemberIds.add(coordinatorId);
    reviewPanels.forEach((p) => p.memberIds.forEach((m) => internalMemberIds.add(m.toString())));
    const teamIds = reviewPanels.flatMap((p) => p.teamIds);

    const created = await VivaPanel.create({
      program: req.auth!.programId,
      coordinatorId,
      internalMembers: Array.from(internalMemberIds),
      externalMembers: [],
      teamIds,
    });
    viva = await VivaPanel.findById(created._id).populate('internalMembers', 'name').lean();
  }

  res.json({ vivaPanel: viva });
});

/** PATCH /panels/viva/:id — coordinator may only add/remove EXTERNAL members. */
export const updateVivaPanel = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { externalMembers } = req.body as { externalMembers: { name: string; affiliation: string; email: string }[] };

  const viva = await VivaPanel.findById(id);
  if (!viva) throw ApiError.notFound('Viva panel not found');
  if (viva.coordinatorId.toString() !== req.auth!.userId) throw ApiError.forbidden('Not your viva panel');

  // Internal members and the coordinator themselves are locked — this route
  // never touches viva.internalMembers, enforcing the constraint structurally.
  viva.externalMembers = externalMembers;
  await viva.save();

  await recordAudit(req.auth!, 'update-externals', 'VivaPanel', viva._id, { count: externalMembers.length });
  res.json({ vivaPanel: viva });
});
