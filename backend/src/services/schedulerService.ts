import { Types } from "mongoose";
import { Availability } from "../models/Availability";
import { Review, REVIEW_ORDER, type ReviewType } from "../models/Review";
import { Team } from "../models/Team";
import { ReviewPanel } from "../models/ReviewPanel";
import { ApiError } from "../utils/ApiError";

interface ClashCheckInput {
  facultyIds: Types.ObjectId[];
  start: Date;
  end: Date;
  excludeReviewId?: Types.ObjectId;
}

/**
 * Clash detection (Section 6.14): before any slot is committed (auto or
 * manual), checks whether an assigned guide/panel member already has an
 * overlapping scheduled review commitment. Treated as core, not bonus.
 */
export async function findSchedulingClash(input: ClashCheckInput) {
  const { facultyIds, start, end, excludeReviewId } = input;
  if (facultyIds.length === 0) return null;

  // Every scheduled review whose team is guided or panel-assigned by one of
  // these faculty, and whose window overlaps [start, end).
  const teams = await Team.find({ guideId: { $in: facultyIds } }).select("_id").lean();
  const panels = await ReviewPanel.find({ memberIds: { $in: facultyIds } }).select("teamIds").lean();
  const teamIds = new Set<string>(teams.map((t) => String(t._id)));
  panels.forEach((p) => p.teamIds.forEach((id) => teamIds.add(String(id))));

  const candidates = await Review.find({
    teamId: { $in: Array.from(teamIds) },
    scheduledDate: { $ne: null },
    ...(excludeReviewId ? { _id: { $ne: excludeReviewId } } : {}),
  }).lean();

  for (const review of candidates) {
    if (!review.scheduledDate || !review.scheduledTime || !review.durationMinutes) continue;
    const rStart = combineDateTime(review.scheduledDate, review.scheduledTime);
    const rEnd = new Date(rStart.getTime() + review.durationMinutes * 60_000);
    if (rStart < end && start < rEnd) {
      return { conflictingReviewId: review._id, teamId: review.teamId, window: { start: rStart, end: rEnd } };
    }
  }
  return null;
}

function combineDateTime(date: Date, time: string): Date {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

/** Enforces the review0 -> review1 -> review2 -> review3 -> viva gating (Section 6.5 / existing system). */
export async function assertPrerequisiteComplete(teamId: string, type: ReviewType): Promise<void> {
  const idx = REVIEW_ORDER.indexOf(type);
  if (idx <= 0) return; // review0 has no prerequisite
  const prereqType = REVIEW_ORDER[idx - 1];
  const prereq = await Review.findOne({ teamId, type: prereqType }).lean();
  if (!prereq || !prereq.closed) {
    throw ApiError.conflict(`${prereqType} must be completed before scheduling ${type}`);
  }
}

/**
 * Auto-generates a full review schedule for a program from submitted
 * availability, greedily assigning the earliest non-conflicting slot per
 * team/review-type pair. Teams the algorithm cannot resolve are left
 * "pending" for the coordinator's manual per-team fallback.
 */
export async function autoGenerateSchedule(program: string, reviewType: ReviewType) {
  const teams = await Team.find({ program, status: { $ne: "forming" } }).lean();
  const results: { teamId: string; scheduled: boolean; reason?: string }[] = [];

  for (const team of teams) {
    try {
      await assertPrerequisiteComplete(String(team._id), reviewType);
    } catch {
      results.push({ teamId: String(team._id), scheduled: false, reason: "prerequisite not complete" });
      continue;
    }

    const panel = await ReviewPanel.findOne({ teamIds: team._id }).lean();
    const facultyIds = [team.guideId, ...(panel?.memberIds ?? [])].filter(Boolean) as Types.ObjectId[];
    if (facultyIds.length === 0) {
      results.push({ teamId: String(team._id), scheduled: false, reason: "no guide/panel assigned yet" });
      continue;
    }

    const availabilities = await Availability.find({ userId: { $in: facultyIds } }).lean();
    const commonSlot = findFirstCommonSlot(availabilities, facultyIds.length);
    if (!commonSlot) {
      results.push({ teamId: String(team._id), scheduled: false, reason: "no common availability found" });
      continue;
    }

    const clash = await findSchedulingClash({ facultyIds, start: commonSlot.startTime, end: commonSlot.endTime });
    if (clash) {
      results.push({ teamId: String(team._id), scheduled: false, reason: "scheduling clash detected" });
      continue;
    }

    await Review.findOneAndUpdate(
      { teamId: team._id, type: reviewType },
      {
        scheduledDate: commonSlot.startTime,
        scheduledTime: `${String(commonSlot.startTime.getHours()).padStart(2, "0")}:${String(
          commonSlot.startTime.getMinutes(),
        ).padStart(2, "0")}`,
        durationMinutes: Math.round((commonSlot.endTime.getTime() - commonSlot.startTime.getTime()) / 60_000),
      },
      { upsert: true },
    );
    results.push({ teamId: String(team._id), scheduled: true });
  }

  return results;
}

function findFirstCommonSlot(
  availabilities: { availableSlots: { startTime: Date; endTime: Date }[] }[],
  requiredCount: number,
): { startTime: Date; endTime: Date } | null {
  if (availabilities.length < requiredCount) return null;
  const [first, ...rest] = availabilities;
  for (const slot of first.availableSlots) {
    const coveredByAll = rest.every((a) =>
      a.availableSlots.some((s) => s.startTime <= slot.startTime && s.endTime >= slot.endTime),
    );
    if (coveredByAll) return slot;
  }
  return null;
}
