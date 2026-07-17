import { Request, Response } from 'express';
import { AvailabilitySlot } from '../models/AvailabilitySlot';
import { ScheduledSlot } from '../models/ScheduledSlot';
import { Review, REVIEW_ORDER } from '../models/Review';
import { Team } from '../models/Team';
import { Faculty } from '../models/Faculty';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { sendMail } from '../services/emailService';
import { notify } from '../services/notificationService';

// ─── Availability submission ─────────────────────────────────────────────────

export const submitAvailability = asyncHandler(async (req: Request, res: Response) => {
  const { periodLabel, startTime, endTime } = req.body as {
    periodLabel: string;
    startTime: string;
    endTime: string;
  };

  if (!periodLabel || !startTime || !endTime) {
    throw ApiError.badRequest('periodLabel, startTime and endTime are required');
  }

  const start = new Date(startTime);
  const end = new Date(endTime);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) throw ApiError.badRequest('Invalid date/time format');
  if (end <= start) throw ApiError.badRequest('endTime must be after startTime');

  const role = req.auth!.role as 'guide' | 'panel' | 'coordinator';
  const slot = await AvailabilitySlot.create({
    facultyId: req.auth!.userId,
    role,
    periodLabel,
    startTime: start,
    endTime: end,
  });

  res.status(201).json({ slot });
});

export const listAvailability = asyncHandler(async (req: Request, res: Response) => {
  const { role, periodLabel } = req.query as { role?: string; periodLabel?: string };
  const filter: Record<string, unknown> = {};
  if (role) filter.role = role;
  if (periodLabel) filter.periodLabel = new RegExp(periodLabel, 'i');

  const slots = await AvailabilitySlot.find(filter)
    .populate('facultyId', 'name email designation')
    .sort({ startTime: 1 })
    .lean();

  res.json({ slots });
});

export const deleteAvailabilitySlot = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const slot = await AvailabilitySlot.findById(id);
  if (!slot) throw ApiError.notFound('Availability slot not found');

  // Owners can delete their own; coordinators/admins can delete any
  const auth = req.auth!;
  if (auth.role !== 'admin' && auth.role !== 'coordinator' && slot.facultyId.toString() !== auth.userId) {
    throw ApiError.forbidden('You can only delete your own availability slots');
  }

  await AvailabilitySlot.findByIdAndDelete(id);
  res.json({ ok: true });
});

// ─── Clash detection helper ───────────────────────────────────────────────────

async function hasClash(facultyId: string, startTime: Date, endTime: Date, excludeSlotId?: string): Promise<boolean> {
  const query: Record<string, unknown> = {
    facultyIds: facultyId,
    $or: [
      { startTime: { $lt: endTime }, endTime: { $gt: startTime } },
    ],
  };
  if (excludeSlotId) (query as any)._id = { $ne: excludeSlotId };
  const count = await ScheduledSlot.countDocuments(query);
  return count > 0;
}

// ─── Prerequisite check ──────────────────────────────────────────────────────

async function hasTeamCompletedReview(teamId: string, reviewType: string): Promise<boolean> {
  const review = await Review.findOne({ teamId, type: reviewType });
  return !!(review && review.closed);
}

function prerequisiteReviewType(reviewType: string): string | null {
  const idx = REVIEW_ORDER.indexOf(reviewType as any);
  if (idx <= 0) return null; // review0 has no prerequisite
  return REVIEW_ORDER[idx - 1];
}

async function validatePrerequisiteForSlotType(teamId: string, reviewType: string): Promise<void> {
  const prereq = prerequisiteReviewType(reviewType);
  if (!prereq) return; // review0 — no gating
  const done = await hasTeamCompletedReview(teamId, prereq);
  if (!done) {
    throw ApiError.conflict(
      `Cannot schedule ${reviewType} — team has not completed ${prereq} yet`
    );
  }
}

// ─── Auto-schedule generation ────────────────────────────────────────────────

export const generateSchedules = asyncHandler(async (req: Request, res: Response) => {
  const { reviewType, periodLabel, durationMinutes } = req.body as {
    reviewType: string;
    periodLabel: string;
    durationMinutes: number;
  };

  if (!reviewType || !periodLabel) throw ApiError.badRequest('reviewType and periodLabel are required');
  const slotDuration = (durationMinutes || 30) * 60 * 1000;

  // Get all availability slots for this period
  const available = await AvailabilitySlot.find({ periodLabel }).sort({ startTime: 1 }).lean();
  if (available.length === 0) throw ApiError.badRequest('No availability slots found for this period');

  const teams = await Team.find({ status: { $ne: 'forming' } }).lean();
  const results: { teamId: string; status: string; message?: string }[] = [];

  for (const team of teams) {
    try {
      await validatePrerequisiteForSlotType(team._id.toString(), reviewType);

      // Find a slot window that fits without clashing for all required faculty
      let assigned = false;
      for (const avSlot of available) {
        const start = new Date(avSlot.startTime.getTime());
        while (start.getTime() + slotDuration <= avSlot.endTime.getTime()) {
          const end = new Date(start.getTime() + slotDuration);
          const clash = await hasClash(avSlot.facultyId.toString(), start, end);
          if (!clash) {
            await ScheduledSlot.create({
              teamId: team._id,
              reviewType,
              facultyIds: [avSlot.facultyId],
              startTime: start,
              endTime: end,
              periodLabel,
              notified: false,
            });
            // Send notification
            const faculty = await Faculty.findById(avSlot.facultyId).select('email name').lean();
            if (faculty) {
              await sendMail({
                to: faculty.email,
                subject: `PRMS — Review Scheduled (${reviewType})`,
                text: `A ${reviewType} slot has been assigned for team "${team.name}" at ${start.toISOString()}. Duration: ${durationMinutes || 30} minutes.`,
              });
              await notify('Faculty', avSlot.facultyId.toString(), 'schedule:assigned',
                `Review slot assigned for team "${team.name}" (${reviewType}) at ${start.toLocaleString()}.`);
            }
            results.push({ teamId: team._id.toString(), status: 'scheduled' });
            assigned = true;
            break;
          }
          start.setTime(start.getTime() + slotDuration);
        }
        if (assigned) break;
      }

      if (!assigned) {
        results.push({ teamId: team._id.toString(), status: 'unscheduled', message: 'No available clash-free slot found' });
      }
    } catch (err) {
      results.push({ teamId: team._id.toString(), status: 'skipped', message: (err as Error).message });
    }
  }

  res.json({ results });
});

export const generateSlotForTeam = asyncHandler(async (req: Request, res: Response) => {
  const { teamId, reviewType, startTime, endTime, facultyIds, periodLabel } = req.body as {
    teamId: string;
    reviewType: string;
    startTime: string;
    endTime: string;
    facultyIds: string[];
    periodLabel: string;
  };

  if (!teamId || !reviewType || !startTime || !endTime || !periodLabel) {
    throw ApiError.badRequest('teamId, reviewType, startTime, endTime, and periodLabel are required');
  }

  const start = new Date(startTime);
  const end = new Date(endTime);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
    throw ApiError.badRequest('Invalid startTime / endTime');
  }

  await validatePrerequisiteForSlotType(teamId, reviewType);

  // Check clashes for each faculty
  for (const fid of (facultyIds || [])) {
    const clash = await hasClash(fid, start, end);
    if (clash) {
      const f = await Faculty.findById(fid).select('name').lean();
      throw ApiError.conflict(`Clash detected for faculty ${f?.name ?? fid} at the requested time`);
    }
  }

  const slot = await ScheduledSlot.create({
    teamId,
    reviewType,
    facultyIds: facultyIds || [],
    startTime: start,
    endTime: end,
    periodLabel,
    notified: false,
  });

  // Notify faculty
  for (const fid of (facultyIds || [])) {
    await notify('Faculty', fid, 'schedule:assigned',
      `A manual review slot for ${reviewType} has been assigned to you.`);
  }

  res.status(201).json({ slot });
});

export const generateSlotsForCoordinator = asyncHandler(async (req: Request, res: Response) => {
  // Coordinator bulk-generates slots for all their teams
  const { reviewType, periodLabel, durationMinutes } = req.body as {
    reviewType: string;
    periodLabel: string;
    durationMinutes: number;
  };
  // Delegate to same logic; coordinator is scoped to their teams via programId
  // Find teams in this program
  const programId = req.auth!.programId;
  if (!programId) throw ApiError.badRequest('No program context');

  const teams = await Team.find({ program: programId, status: { $ne: 'forming' } }).lean();
  const available = await AvailabilitySlot.find({ periodLabel, role: 'coordinator' }).sort({ startTime: 1 }).lean();
  const slotDuration = (durationMinutes || 30) * 60 * 1000;
  const results: { teamId: string; status: string; message?: string }[] = [];

  for (const team of teams) {
    try {
      await validatePrerequisiteForSlotType(team._id.toString(), reviewType);
      let assigned = false;
      for (const avSlot of available) {
        if (avSlot.facultyId.toString() !== req.auth!.userId) continue;
        const start = new Date(avSlot.startTime.getTime());
        while (start.getTime() + slotDuration <= avSlot.endTime.getTime()) {
          const end = new Date(start.getTime() + slotDuration);
          const clash = await hasClash(avSlot.facultyId.toString(), start, end);
          if (!clash) {
            await ScheduledSlot.create({
              teamId: team._id,
              reviewType,
              facultyIds: [avSlot.facultyId],
              startTime: start,
              endTime: end,
              periodLabel,
              notified: false,
            });
            results.push({ teamId: team._id.toString(), status: 'scheduled' });
            assigned = true;
            break;
          }
          start.setTime(start.getTime() + slotDuration);
        }
        if (assigned) break;
      }
      if (!assigned) results.push({ teamId: team._id.toString(), status: 'unscheduled', message: 'No clash-free slot' });
    } catch (err) {
      results.push({ teamId: team._id.toString(), status: 'skipped', message: (err as Error).message });
    }
  }
  res.json({ results });
});

export const listScheduledSlots = asyncHandler(async (req: Request, res: Response) => {
  const { teamId, program, reviewType, periodLabel } = req.query as Record<string, string>;
  const filter: Record<string, unknown> = {};
  if (teamId) filter.teamId = teamId;
  if (reviewType) filter.reviewType = reviewType;
  if (periodLabel) filter.periodLabel = new RegExp(periodLabel, 'i');

  const slots = await ScheduledSlot.find(filter)
    .populate('teamId', 'name program')
    .populate('facultyIds', 'name email designation')
    .sort({ startTime: 1 })
    .lean();

  const filtered = program
    ? slots.filter((s: any) => s.teamId?.program?.toString() === program || s.teamId?.name === program)
    : slots;

  res.json({ slots: filtered });
});

export const clearSchedules = asyncHandler(async (req: Request, res: Response) => {
  const { reviewType, periodLabel } = req.body as { reviewType?: string; periodLabel?: string };
  const filter: Record<string, unknown> = {};
  if (reviewType) filter.reviewType = reviewType;
  if (periodLabel) filter.periodLabel = periodLabel;

  const result = await ScheduledSlot.deleteMany(filter);
  res.json({ deleted: result.deletedCount });
});

export const deleteAllottedSlot = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const slot = await ScheduledSlot.findByIdAndDelete(id);
  if (!slot) throw ApiError.notFound('Scheduled slot not found');
  res.json({ ok: true });
});
