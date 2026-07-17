import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ok } from "../utils/apiResponse";
import { ApiError } from "../utils/ApiError";
import { Team } from "../models/Team";
import { Faculty } from "../models/Faculty";
import { Program } from "../models/Program";
import { GuideRequest } from "../models/GuideRequest";
import { ReviewPanel } from "../models/Panel";
import { recordAudit } from "../services/auditService";
import { emitAllocationUpdated } from "../config/socket";

/** Admin Assignment Dashboard primary view: Team | Guide | Panel | Coordinator. */
export const getAssignments = asyncHandler(async (req: Request, res: Response) => {
  const { program } = req.query;
  const filter: Record<string, unknown> = {};
  if (program) filter.program = program;

  const teams = await Team.find(filter)
    .populate("guideId", "name")
    .populate("students", "name rollNo")
    .lean();

  return ok(res, teams);
});

/** Single batch Save */
export const batchUpdateAssignments = asyncHandler(async (req: Request, res: Response) => {
  const { program, updates } = req.body as {
    program: string;
    updates: { teamId: string; guideId?: string | null; panelMemberIds?: string[]; coordinatorId?: string | null }[];
  };

  const ops = updates.map((u) => ({
    updateOne: {
      filter: { _id: u.teamId },
      update: {
        ...(u.guideId !== undefined ? { guideId: u.guideId } : {}),
        ...(u.guideId ? { status: "active" } : {}),
      },
    },
  }));
  if (ops.length > 0) await Team.bulkWrite(ops);

  for (const u of updates) {
    if (u.panelMemberIds || u.coordinatorId) {
      await ReviewPanel.findOneAndUpdate(
        { program, teamIds: u.teamId },
        {
          $addToSet: { teamIds: u.teamId },
          ...(u.panelMemberIds ? { memberIds: u.panelMemberIds } : {}),
          ...(u.coordinatorId ? { coordinatorId: u.coordinatorId } : {}),
        },
        { upsert: true },
      );
    }
  }

  await recordAudit(req.auth!, "assignments.batchUpdate", "Team", req.auth!.userId, { program, count: updates.length });
  emitAllocationUpdated(program, { updatedCount: updates.length });
  return ok(res, { updatedCount: updates.length });
});

/** Auto-assign Guides */
export const autoAssignGuides = asyncHandler(async (req: Request, res: Response) => {
  const { program } = req.body as { program: string };
  const programDoc = await Program.findById(program).lean();
  if (!programDoc) throw ApiError.badRequest("Unknown program");

  const unassignedTeams = await Team.find({ program, guideId: { $exists: false } }).lean();
  const faculty = await Faculty.find().sort({ seniority: 1 }).lean();

  const capField = programDoc.type === "UG" ? "ug" : "pg";
  const programsOfSameType = await Program.find({ type: programDoc.type }).select("_id").lean();
  const programIds = programsOfSameType.map((p) => p._id);

  const currentLoad = new Map<string, number>();
  for (const f of faculty) {
    const count = await GuideRequest.countDocuments({ guideId: f._id, status: "accepted", program: { $in: programIds } });
    currentLoad.set(String(f._id), count);
  }

  const assigned: { teamId: string; guideId: string }[] = [];
  for (const team of unassignedTeams) {
    const candidate = faculty.find((f) => (currentLoad.get(String(f._id)) ?? 0) < f.guideLimits[capField]);
    if (!candidate) continue;
    await Team.findByIdAndUpdate(team._id, { guideId: candidate._id, status: "active" });
    currentLoad.set(String(candidate._id), (currentLoad.get(String(candidate._id)) ?? 0) + 1);
    assigned.push({ teamId: String(team._id), guideId: String(candidate._id) });
  }

  await recordAudit(req.auth!, "assignments.autoAssign", "Team", req.auth!.userId, { program, assignedCount: assigned.length });
  emitAllocationUpdated(program, { autoAssignedCount: assigned.length });
  return ok(res, { assignedCount: assigned.length, unresolvedCount: unassignedTeams.length - assigned.length, assigned });
});

/** Auto-assign Panels: distributes unassigned teams to review panels avoiding conflict of interest (guide on panel) */
export const autoAssignPanels = asyncHandler(async (req: Request, res: Response) => {
  const { program } = req.body as { program: string };
  const panels = await ReviewPanel.find({ program }).lean();
  if (panels.length === 0) throw ApiError.badRequest("No review panels created for this programme yet");

  // Find teams not assigned to any panel in this programme
  const assignedTeamIds = new Set<string>();
  panels.forEach((p) => p.teamIds.forEach((tId) => assignedTeamIds.add(tId.toString())));

  const unassignedTeams = await Team.find({ program, _id: { $nin: Array.from(assignedTeamIds) } }).lean();

  const assigned: { teamId: string; panelId: string }[] = [];
  const panelLoads = new Map<string, number>();
  panels.forEach((p) => panelLoads.set(p._id.toString(), p.teamIds.length));

  for (const team of unassignedTeams) {
    const guideIdStr = team.guideId?.toString();

    // Filter panels without conflict of interest
    let eligiblePanels = panels.filter((p) => {
      if (!guideIdStr) return true;
      const isCoordinator = p.coordinatorId?.toString() === guideIdStr;
      const isMember = p.memberIds.some((mId) => mId.toString() === guideIdStr);
      return !isCoordinator && !isMember;
    });

    if (eligiblePanels.length === 0) {
      eligiblePanels = panels; // Fallback to least loaded if conflict unavoidable
    }

    // Sort by current load ascending
    eligiblePanels.sort((a, b) => (panelLoads.get(a._id.toString()) ?? 0) - (panelLoads.get(b._id.toString()) ?? 0));
    const targetPanel = eligiblePanels[0];

    await ReviewPanel.findByIdAndUpdate(targetPanel._id, { $addToSet: { teamIds: team._id } });
    panelLoads.set(targetPanel._id.toString(), (panelLoads.get(targetPanel._id.toString()) ?? 0) + 1);
    assigned.push({ teamId: team._id.toString(), panelId: targetPanel._id.toString() });
  }

  await recordAudit(req.auth!, "assignments.autoAssignPanels", "Panel", req.auth!.userId, { program, assignedCount: assigned.length });
  emitAllocationUpdated(program, { autoAssignedPanelsCount: assigned.length });
  return ok(res, { assignedCount: assigned.length, assigned });
});

/** Faculty workload view */
export const getFacultyWorkload = asyncHandler(async (_req: Request, res: Response) => {
  const faculty = await Faculty.find().select("name seniority guideLimits").lean();
  const workload = await Promise.all(
    faculty.map(async (f) => {
      const guideCount = await Team.countDocuments({ guideId: f._id });
      const coordinatorPanels = await ReviewPanel.find({ coordinatorId: f._id }).lean();
      const coordinatorCount = coordinatorPanels.reduce((sum: number, p: any) => sum + (p.teamIds?.length || 0), 0);
      const memberPanels = await ReviewPanel.find({ memberIds: f._id }).lean();
      const panelCount = memberPanels.reduce((sum: number, p: any) => sum + (p.teamIds?.length || 0), 0);
      return { facultyId: f._id, name: f.name, guideCount, coordinatorCount, panelCount };
    }),
  );
  return ok(res, workload);
});
