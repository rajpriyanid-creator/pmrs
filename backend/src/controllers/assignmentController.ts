import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ok } from "../utils/apiResponse";
import { ApiError } from "../utils/ApiError";
import { Team } from "../models/Team";
import { Faculty } from "../models/Faculty";
import { Program } from "../models/Program";
import { GuideRequest } from "../models/GuideRequest";
import { recordAudit } from "../services/auditService";
import { emitAllocationUpdated } from "../config/socket";

/** Admin Assignment Dashboard primary view (Section 6.9): Team | Guide | Panel | Coordinator. */
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

/**
 * Single batch Save (Section 6.9): one bulk request commits guide/panel/
 * coordinator assignments for N teams instead of N sequential per-row saves.
 * Uses bulkWrite for one round-trip to the DB regardless of N.
 */
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

  // Panel member / coordinator assignment updates the ReviewPanel doc, not Team directly.
  const { ReviewPanel } = await import("../models/ReviewPanel");
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

  await recordAudit(req, "assignments.batchUpdate", "Team", undefined, { program, count: updates.length });
  emitAllocationUpdated(program, { updatedCount: updates.length });
  return ok(res, { updatedCount: updates.length });
});

/**
 * Auto-assign: distributes unassigned teams to guides respecting UG/PG caps,
 * ordered by faculty seniority as a stable, deterministic tie-break (Section
 * 6.9 "first-class feature to be rebuilt cleanly").
 */
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

  await recordAudit(req, "assignments.autoAssign", "Team", undefined, { program, assignedCount: assigned.length });
  emitAllocationUpdated(program, { autoAssignedCount: assigned.length });
  return ok(res, { assignedCount: assigned.length, unresolvedCount: unassignedTeams.length - assigned.length, assigned });
});

/** Faculty workload view (Section 11 bonus): guide/panel/coordinator load at a glance. */
export const getFacultyWorkload = asyncHandler(async (_req: Request, res: Response) => {
  const faculty = await Faculty.find().select("name seniority isCoordinatorFor isPanelFor guideLimits").lean();
  const workload = await Promise.all(
    faculty.map(async (f) => {
      const guideCount = await Team.countDocuments({ guideId: f._id });
      const coordinatorCount = f.isCoordinatorFor.reduce((sum, a) => sum + a.teamIds.length, 0);
      const panelCount = f.isPanelFor.reduce((sum, a) => sum + a.teamIds.length, 0);
      return { facultyId: f._id, name: f.name, guideCount, coordinatorCount, panelCount };
    }),
  );
  return ok(res, workload);
});
