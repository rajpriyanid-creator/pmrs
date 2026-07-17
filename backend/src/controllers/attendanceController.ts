import { Request, Response } from 'express';
import { Attendance } from '../models/Attendance';
import { Team } from '../models/Team';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { recordAudit } from '../services/auditService';
import { notify } from '../services/notificationService';
import { buildWorkbook, ColumnDef } from '../services/excelService';

export const getAttendance = asyncHandler(async (req: Request, res: Response) => {
  const { teamId, program, kind } = req.query as { teamId?: string; program?: string; kind?: 'review' | 'semester' };
  const filter: Record<string, unknown> = {};
  if (teamId) filter.teamId = teamId;
  if (kind) filter.kind = kind;

  const records = await Attendance.find(filter)
    .populate('teamId', 'name program')
    .populate('perStudent.studentId', 'name rollNo')
    .sort({ createdAt: -1 })
    .lean();

  const filtered = program
    ? records.filter((r: any) => r.teamId?.program?.toString() === program || r.teamId?.name === program)
    : records;

  res.json({ attendance: filtered });
});

/** POST /attendance/:teamId/submit — coordinator only, date/time + checkboxes saved together (spec 6.6). */
export const submitAttendance = asyncHandler(async (req: Request, res: Response) => {
  const { teamId } = req.params;
  const { reviewId, kind, perStudent, reviewDate, reviewTime } = req.body as {
    reviewId: string | null;
    kind: 'review' | 'semester';
    perStudent: { studentId: string; present: boolean }[];
    reviewDate?: string;
    reviewTime?: string;
  };

  const team = await Team.findById(teamId);
  if (!team) throw ApiError.notFound('Team not found');

  const validStudentIds = new Set(team.students.map((s) => s.toString()));
  for (const entry of perStudent) {
    if (!validStudentIds.has(entry.studentId)) {
      throw ApiError.badRequest(`Student ${entry.studentId} is not a member of this team`);
    }
  }

  const attendance = await Attendance.findOneAndUpdate(
    { teamId, reviewId: reviewId ?? null, kind },
    {
      teamId,
      reviewId: reviewId ?? null,
      kind,
      perStudent,
      reviewDate: reviewDate ?? null,
      reviewTime: reviewTime ?? null,
      recordedBy: req.auth!.userId,
    },
    { upsert: true, new: true, runValidators: true }
  );

  await recordAudit(req.auth!, 'submit', 'Attendance', attendance._id, { kind, count: perStudent.length });

  for (const entry of perStudent) {
    await notify('Student', entry.studentId, 'attendance:recorded', `Attendance recorded for team "${team.name}".`);
  }

  res.json({ attendance });
});

const ATTENDANCE_COLUMNS: ColumnDef[] = [
  { header: 'Team', key: 'team' },
  { header: 'Student', key: 'student' },
  { header: 'Roll No', key: 'rollNo' },
  { header: 'Kind', key: 'kind' },
  { header: 'Date', key: 'date' },
  { header: 'Time', key: 'time' },
  { header: 'Present', key: 'present' },
];

export const exportAttendance = asyncHandler(async (req: Request, res: Response) => {
  const { teamId, program } = req.query as { teamId?: string; program?: string };
  const filter: Record<string, unknown> = {};
  if (teamId) filter.teamId = teamId;

  const records = await Attendance.find(filter)
    .populate('teamId', 'name program')
    .populate('perStudent.studentId', 'name rollNo')
    .lean();

  const filtered = program ? records.filter((r: any) => r.teamId?.program?.toString() === program) : records;

  const rows: Record<string, unknown>[] = [];
  for (const record of filtered as any[]) {
    for (const entry of record.perStudent) {
      rows.push({
        team: record.teamId?.name ?? '',
        student: entry.studentId?.name ?? '',
        rollNo: entry.studentId?.rollNo ?? '',
        kind: record.kind,
        date: record.reviewDate ? new Date(record.reviewDate).toISOString().slice(0, 10) : '',
        time: record.reviewTime ?? '',
        present: entry.present ? 'Present' : 'Absent',
      });
    }
  }

  const buffer = await buildWorkbook('Attendance', ATTENDANCE_COLUMNS, rows);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="attendance.xlsx"');
  res.send(buffer);
});
