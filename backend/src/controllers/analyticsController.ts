import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ok } from "../utils/apiResponse";
import { Team } from "../models/Team";
import { MarksSummary } from "../models/MarksSummary";
import { Attendance } from "../models/Attendance";
import { Faculty } from "../models/Faculty";
import { Review } from "../models/Review";

/** Analytics dashboard aggregates (Section 11 bonus feature): kept read-only, cheap, and cache-friendly. */
export const getProgramOverview = asyncHandler(async (req: Request, res: Response) => {
  const { program } = req.query;
  const filter = program ? { program } : {};

  const [teamCount, activeCount, formingCount] = await Promise.all([
    Team.countDocuments(filter),
    Team.countDocuments({ ...filter, status: "active" }),
    Team.countDocuments({ ...filter, status: "forming" }),
  ]);

  const teams = await Team.find(filter).select("_id").lean();
  const teamIds = teams.map((t) => t._id);

  const marksAgg = await MarksSummary.aggregate([
    { $match: { teamId: { $in: teamIds } } },
    { $group: { _id: "$reviewId", avgScore: { $avg: "$average" } } },
  ]);

  const reviewTypes = await Review.find({ _id: { $in: marksAgg.map((m) => m._id) } }).select("type").lean();
  const typeById = new Map(reviewTypes.map((r) => [String(r._id), r.type]));
  const marksByStage = marksAgg.map((m) => ({ stage: typeById.get(String(m._id)) ?? "unknown", avgScore: Math.round(m.avgScore * 100) / 100 }));

  const attendanceRecords = await Attendance.find({ teamId: { $in: teamIds } }).lean();
  const totalMarks = attendanceRecords.flatMap((a) => a.perStudent);
  const presentCount = totalMarks.filter((s) => s.present).length;
  const attendanceRate = totalMarks.length > 0 ? Math.round((presentCount / totalMarks.length) * 10000) / 100 : null;

  return ok(res, {
    teamCount, activeCount, formingCount,
    marksByStage,
    attendanceRate,
  });
});

export const getGuideWorkloadDistribution = asyncHandler(async (_req: Request, res: Response) => {
  const faculty = await Faculty.find().select("name guideLimits").lean();
  const distribution = await Promise.all(
    faculty.map(async (f) => ({
      name: f.name,
      teamCount: await Team.countDocuments({ guideId: f._id }),
      ugCap: f.guideLimits.ug,
      pgCap: f.guideLimits.pg,
    })),
  );
  return ok(res, distribution.filter((d) => d.teamCount > 0));
});
