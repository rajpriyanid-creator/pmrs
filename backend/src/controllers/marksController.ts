import { Request, Response } from 'express';
import { MarksEntry, MarksSummary } from '../models/Marks';
import { Review } from '../models/Review';
import { Team } from '../models/Team';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { recordAudit } from '../services/auditService';
import { getOverallTeamAverage, recomputeReviewSummary } from '../services/marksService';
import { notify } from '../services/notificationService';
import { getIO } from '../services/socketService';
import { buildWorkbook, ColumnDef } from '../services/excelService';

export const getMarksForReview = asyncHandler(async (req: Request, res: Response) => {
  const { teamId, reviewId } = req.query as { teamId: string; reviewId: string };
  if (!teamId || !reviewId) throw ApiError.badRequest('teamId and reviewId are required');

  const entries = await MarksEntry.find({ teamId, reviewId })
    .populate('enteredBy', 'name')
    .populate('studentId', 'name rollNo')
    .lean();

  // Students / Assistants only ever see confirmed, published entries.
  const role = req.auth!.role;
  const visible = role === 'student' || role === 'assistant' ? entries.filter((e) => e.confirmed) : entries;

  // Attach computed totals & percentages to each entry
  const withTotals = visible.map((e) => {
    const total = e.mark1 + e.mark2 + e.mark3 + e.mark4;
    const percentage = Math.round((total / 40) * 10000) / 100;
    return { ...e, total, percentage };
  });

  res.json({ entries: withTotals });
});

export const submitMarks = asyncHandler(async (req: Request, res: Response) => {
  const { teamId, reviewId, studentId, mark1, mark2, mark3, mark4, confirm } = req.body as {
    teamId: string;
    reviewId: string;
    studentId: string;
    mark1: number;
    mark2: number;
    mark3: number;
    mark4: number;
    confirm: boolean;
  };

  // Validate rubric inputs
  for (const [key, val] of Object.entries({ mark1, mark2, mark3, mark4 })) {
    const n = Number(val);
    if (!Number.isFinite(n) || n < 0 || n > 10) {
      throw ApiError.badRequest(`${key} must be a number between 0 and 10`);
    }
  }

  const review = await Review.findById(reviewId);
  if (!review) throw ApiError.notFound('Review not found');
  if (!review.hasMarks) throw ApiError.badRequest('Review 0 does not accept marks');
  if (review.closed) throw ApiError.conflict('This review has been closed for marks entry');

  if (req.auth!.role !== 'guide' && req.auth!.role !== 'panel') {
    throw ApiError.forbidden('Only Guide and Panel Member roles may enter marks');
  }
  const role = req.auth!.role === 'panel' ? 'panel' : 'guide';
  const slotType = review.type as 'review1' | 'review2' | 'review3' | 'viva';

  // Save-then-update semantics: upsert on unique index (studentId, teamId, reviewId, enteredBy, slotType)
  const entry = await MarksEntry.findOneAndUpdate(
    { studentId, teamId, reviewId, enteredBy: req.auth!.userId, slotType },
    {
      studentId,
      teamId,
      reviewId,
      enteredBy: req.auth!.userId,
      role,
      slotType,
      mark1: Number(mark1),
      mark2: Number(mark2),
      mark3: Number(mark3),
      mark4: Number(mark4),
      confirmed: Boolean(confirm),
      submittedAt: confirm ? new Date() : null,
    },
    { upsert: true, new: true, runValidators: true }
  );

  if (confirm) {
    await recomputeReviewSummary(teamId, reviewId);
    await recordAudit(req.auth!, 'submit-marks', 'MarksEntry', entry._id, {
      mark1,
      mark2,
      mark3,
      mark4,
      total: Number(mark1) + Number(mark2) + Number(mark3) + Number(mark4),
    });

    const team = await Team.findById(teamId);
    if (team) {
      for (const sid of team.students) {
        await notify('Student', sid.toString(), 'marks:published', `Marks published for ${review.type.toUpperCase()}.`);
      }
      getIO()?.to(`team:${teamId}`).emit('marks:published', { teamId, reviewId });
    }
  }

  const total = entry.mark1 + entry.mark2 + entry.mark3 + entry.mark4;
  const percentage = Math.round((total / 40) * 10000) / 100;
  res.json({ entry: { ...entry.toObject(), total, percentage } });
});

/** Bulk-submit rubric marks for all students in a team at once. */
export const submitMarksForTeam = asyncHandler(async (req: Request, res: Response) => {
  const { teamId, reviewId, studentMarks, confirm } = req.body as {
    teamId: string;
    reviewId: string;
    studentMarks: { studentId: string; mark1: number; mark2: number; mark3: number; mark4: number }[];
    confirm: boolean;
  };

  if (!Array.isArray(studentMarks) || studentMarks.length === 0) {
    throw ApiError.badRequest('studentMarks array is required');
  }

  const review = await Review.findById(reviewId);
  if (!review) throw ApiError.notFound('Review not found');
  if (!review.hasMarks) throw ApiError.badRequest('Review 0 does not accept marks');
  if (review.closed) throw ApiError.conflict('This review has been closed for marks entry');

  if (req.auth!.role !== 'guide' && req.auth!.role !== 'panel') {
    throw ApiError.forbidden('Only Guide and Panel Member roles may enter marks');
  }
  const role = req.auth!.role === 'panel' ? 'panel' : 'guide';
  const slotType = review.type as 'review1' | 'review2' | 'review3' | 'viva';

  const saved = [];
  for (const sm of studentMarks) {
    for (const [key, val] of Object.entries({ mark1: sm.mark1, mark2: sm.mark2, mark3: sm.mark3, mark4: sm.mark4 })) {
      const n = Number(val);
      if (!Number.isFinite(n) || n < 0 || n > 10) {
        throw ApiError.badRequest(`${key} for student ${sm.studentId} must be 0-10`);
      }
    }
    const entry = await MarksEntry.findOneAndUpdate(
      { studentId: sm.studentId, teamId, reviewId, enteredBy: req.auth!.userId, slotType },
      {
        studentId: sm.studentId,
        teamId,
        reviewId,
        enteredBy: req.auth!.userId,
        role,
        slotType,
        mark1: Number(sm.mark1),
        mark2: Number(sm.mark2),
        mark3: Number(sm.mark3),
        mark4: Number(sm.mark4),
        confirmed: Boolean(confirm),
        submittedAt: confirm ? new Date() : null,
      },
      { upsert: true, new: true, runValidators: true }
    );
    const total = entry.mark1 + entry.mark2 + entry.mark3 + entry.mark4;
    saved.push({ ...entry.toObject(), total, percentage: Math.round((total / 40) * 10000) / 100 });
  }

  if (confirm) {
    await recomputeReviewSummary(teamId, reviewId);
    const team = await Team.findById(teamId);
    if (team) {
      for (const sid of team.students) {
        await notify('Student', sid.toString(), 'marks:published', `Marks published for ${review.type.toUpperCase()}.`);
      }
      getIO()?.to(`team:${teamId}`).emit('marks:published', { teamId, reviewId });
    }
  }

  res.json({ entries: saved });
});

export const getMarksSummary = asyncHandler(async (req: Request, res: Response) => {
  const { teamId } = req.params;
  const summaries = await MarksSummary.find({ teamId }).populate('reviewId', 'type').lean();
  const overall = await getOverallTeamAverage(teamId);
  res.json({ summaries, overall });
});

const MARKS_COLUMNS: ColumnDef[] = [
  { header: 'Team', key: 'team' },
  { header: 'Review', key: 'review' },
  { header: 'Student', key: 'student' },
  { header: 'Entered By', key: 'enteredBy' },
  { header: 'Role', key: 'role' },
  { header: 'Mark 1', key: 'mark1' },
  { header: 'Mark 2', key: 'mark2' },
  { header: 'Mark 3', key: 'mark3' },
  { header: 'Mark 4', key: 'mark4' },
  { header: 'Total (/40)', key: 'total' },
  { header: 'Percentage', key: 'percentage' },
  { header: 'Confirmed', key: 'confirmed' },
];

export const exportMarks = asyncHandler(async (req: Request, res: Response) => {
  const { teamId } = req.query as { teamId?: string };
  const filter = teamId ? { teamId } : {};
  const entries = await MarksEntry.find(filter)
    .populate('teamId', 'name')
    .populate('reviewId', 'type')
    .populate('enteredBy', 'name')
    .populate('studentId', 'name rollNo')
    .lean();

  const rows = (entries as any[]).map((e) => {
    const total = e.mark1 + e.mark2 + e.mark3 + e.mark4;
    return {
      team: e.teamId?.name ?? '',
      review: e.reviewId?.type ?? '',
      student: e.studentId ? `${e.studentId.name} (${e.studentId.rollNo})` : '',
      enteredBy: e.enteredBy?.name ?? '',
      role: e.role,
      mark1: e.mark1,
      mark2: e.mark2,
      mark3: e.mark3,
      mark4: e.mark4,
      total,
      percentage: `${Math.round((total / 40) * 10000) / 100}%`,
      confirmed: e.confirmed ? 'Yes' : 'No',
    };
  });

  const buffer = await buildWorkbook('Marks', MARKS_COLUMNS, rows);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="marks.xlsx"');
  res.send(buffer);
});
