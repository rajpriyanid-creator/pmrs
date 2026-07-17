import { Request, Response } from 'express';
import { Team } from '../models/Team';
import { Faculty } from '../models/Faculty';
import { ReviewPanel } from '../models/Panel';
import { Program } from '../models/Program';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { cacheInvalidatePrefix, cacheWrap } from '../services/cacheService';
import { recordAudit } from '../services/auditService';
import { getGuideCapacity } from '../services/guideCapacityService';

export const getAllocationTable = asyncHandler(async (req: Request, res: Response) => {
  const program = req.query.program as string;
  if (!program) throw ApiError.badRequest('program is required');

  const data = await cacheWrap(`allocations:${program}:table`, 30, async () => {
    const teams = await Team.find({ program }).populate('guideId', 'name').lean();
    const panels = await ReviewPanel.find({ program }).populate('memberIds', 'name').populate('coordinatorId', 'name').lean();
    const panelByTeam = new Map<string, (typeof panels)[number]>();
    for (const panel of panels) {
      for (const teamId of panel.teamIds) panelByTeam.set(teamId.toString(), panel);
    }
    return teams.map((team) => ({
      teamId: team._id,
      teamName: team.name,
      guide: team.guideId,
      panel: panelByTeam.get(team._id.toString()) ?? null,
    }));
  });

  res.json({ rows: data });
});

interface BatchUpdate {
  teamId: string;
  guideId?: string | null;
  coordinatorId?: string | null;
  panelMemberIds?: string[];
}

export const batchUpdateAssignments = asyncHandler(async (req: Request, res: Response) => {
  const { program, updates } = req.body as { program: string; updates: BatchUpdate[] };
  const programDoc = await Program.findById(program);
  if (!programDoc) throw ApiError.badRequest('Unknown program');
  if (!Array.isArray(updates) || updates.length === 0) throw ApiError.badRequest('No updates provided');

  // Single bulk request per Section 3/6.9 — one round trip regardless of N rows edited.
  const teamOps = [];
  const panelPullOps = [];
  const panelUpserts: { teamId: string; coordinatorId: string; memberIds: string[] }[] = [];

  for (const update of updates) {
    if (update.guideId !== undefined) {
      teamOps.push({
        updateOne: { filter: { _id: update.teamId, program }, update: { guideId: update.guideId } },
      });
    }
    if (update.coordinatorId !== undefined || update.panelMemberIds !== undefined) {
      if (update.panelMemberIds && update.panelMemberIds.length > 4) {
        throw ApiError.badRequest(`Team ${update.teamId}: review panels are capped at 4 members`);
      }
      // Remove this team from whichever panel it previously belonged to.
      panelPullOps.push({
        updateMany: { filter: { program, teamIds: update.teamId }, update: { $pull: { teamIds: update.teamId } } },
      });
      if (update.coordinatorId) {
        panelUpserts.push({
          teamId: update.teamId,
          coordinatorId: update.coordinatorId,
          memberIds: update.panelMemberIds ?? [],
        });
      }
    }
  }

  if (teamOps.length) await Team.bulkWrite(teamOps);
  if (panelPullOps.length) await ReviewPanel.bulkWrite(panelPullOps);

  // Panel membership is modeled as ReviewPanel documents grouped by
  // coordinator+program; re-derive membership per affected team.
  for (const { teamId, coordinatorId, memberIds } of panelUpserts) {
    await ReviewPanel.findOneAndUpdate(
      { program, coordinatorId },
      { $addToSet: { teamIds: teamId }, $set: { memberIds } },
      { upsert: true }
    );
  }

  await cacheInvalidatePrefix(`allocations:${program}`);
  await recordAudit(req.auth!, 'batch-update', 'Assignments', program, { updateCount: updates.length });

  res.json({ ok: true, updated: updates.length });
});

/** Simple greedy auto-assign respecting UG/PG caps, ordered by (rebuilt) faculty seniority as a tiebreak-ready field. */
export const autoAssign = asyncHandler(async (req: Request, res: Response) => {
  const { program } = req.body as { program: string };
  const programDoc = await Program.findById(program);
  if (!programDoc) throw ApiError.badRequest('Unknown program');

  const unassignedTeams = await Team.find({ program, guideId: null });
  const guides = await Faculty.find({ isAdmin: false }).sort({ seniority: 1 });

  const assignments: { teamId: string; guideId: string }[] = [];
  const capacityCache = new Map<string, number>();

  for (const guide of guides) {
    const capacity = await getGuideCapacity(guide._id, guide.guideLimits);
    const remaining = programDoc.type === 'UG' ? capacity.ug.remaining : capacity.pg.remaining;
    capacityCache.set(guide._id.toString(), remaining);
  }

  for (const team of unassignedTeams) {
    const guide = guides.find((g) => (capacityCache.get(g._id.toString()) ?? 0) > 0);
    if (!guide) break; // no capacity left anywhere
    assignments.push({ teamId: team._id.toString(), guideId: guide._id.toString() });
    capacityCache.set(guide._id.toString(), (capacityCache.get(guide._id.toString()) ?? 1) - 1);
  }

  if (assignments.length) {
    await Team.bulkWrite(
      assignments.map((a) => ({ updateOne: { filter: { _id: a.teamId }, update: { guideId: a.guideId } } }))
    );
    await cacheInvalidatePrefix(`allocations:${program}`);
    await recordAudit(req.auth!, 'auto-assign', 'Assignments', program, { assignedCount: assignments.length });
  }

  res.json({ assignedCount: assignments.length, unassignedRemaining: unassignedTeams.length - assignments.length });
});
