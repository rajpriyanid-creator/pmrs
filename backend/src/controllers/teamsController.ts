import { Request, Response } from 'express';
import { Team } from '../models/Team';
import { TeamInvite } from '../models/TeamInvite';
import { Student } from '../models/Student';
import { Program } from '../models/Program';
import { ReviewPanel } from '../models/Panel';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { getPagination, paginated } from '../utils/pagination';
import { notify } from '../services/notificationService';
import { recordAudit } from '../services/auditService';

export const listTeams = asyncHandler(async (req: Request, res: Response) => {
  const pagination = getPagination(req);
  const filter: Record<string, unknown> = {};
  if (req.query.program) filter.program = req.query.program;
  if (req.query.status) filter.status = req.query.status;

  // Non-admin faculty are implicitly scoped to their own program context.
  if (req.auth!.role !== 'admin' && req.auth!.role !== 'assistant' && req.auth!.programId) {
    filter.program = req.auth!.programId;
  }

  if (req.auth!.role === 'guide') {
    filter.guideId = req.auth!.userId;
  } else if (req.auth!.role === 'coordinator' || req.auth!.role === 'panel') {
    const panelFilter =
      req.auth!.role === 'coordinator' ? { coordinatorId: req.auth!.userId } : { memberIds: req.auth!.userId };
    const panels = await ReviewPanel.find(panelFilter).select('teamIds').lean();
    const teamIds = panels.flatMap((p) => p.teamIds);
    filter._id = { $in: teamIds };
  } else if (req.auth!.role === 'student') {
    filter.students = req.auth!.userId;
  }

  const [items, total] = await Promise.all([
    Team.find(filter)
      .populate('students', 'name rollNo')
      .populate('guideId', 'name')
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),
    Team.countDocuments(filter),
  ]);
  res.json(paginated(items, total, pagination));
});


export const createTeam = asyncHandler(async (req: Request, res: Response) => {
  const { name, program, studentIds } = req.body as { name: string; program: string; studentIds: string[] };
  const programDoc = await Program.findById(program);
  if (!programDoc) throw ApiError.badRequest('Unknown program');
  if (!studentIds || studentIds.length < 1) throw ApiError.badRequest('At least one student is required');

  const students = await Student.find({ _id: { $in: studentIds }, program });
  if (students.length !== studentIds.length) throw ApiError.badRequest('One or more students not found in this program');

  const team = await Team.create({ name, program, students: studentIds, status: 'forming' });
  res.status(201).json({ team });
});

export const inviteToTeam = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params; // teamId
  const { toStudentId } = req.body as { toStudentId: string };
  const team = await Team.findById(id);
  if (!team) throw ApiError.notFound('Team not found');
  if (team.status !== 'forming') throw ApiError.conflict('Team is no longer accepting invites');

  const fromStudentId = req.auth!.userId;
  if (!team.students.some((s) => s.toString() === fromStudentId)) {
    throw ApiError.forbidden('Only current team members can send invites');
  }

  const invite = await TeamInvite.create({ teamId: id, fromStudent: fromStudentId, toStudent: toStudentId, status: 'pending' });
  await notify('Student', toStudentId, 'invite:sent', `You've been invited to join team "${team.name}".`);
  res.status(201).json({ invite });
});

export const respondToInvite = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params; // inviteId
  const { accept } = req.body as { accept: boolean };
  const invite = await TeamInvite.findById(id);
  if (!invite) throw ApiError.notFound('Invite not found');
  if (invite.toStudent.toString() !== req.auth!.userId) throw ApiError.forbidden('This invite is not addressed to you');
  if (invite.status !== 'pending') throw ApiError.conflict('This invite was already responded to');

  invite.status = accept ? 'accepted' : 'declined';
  await invite.save();

  if (accept) {
    await Team.findByIdAndUpdate(invite.teamId, { $addToSet: { students: invite.toStudent } });
  }

  await notify(
    'Student',
    invite.fromStudent.toString(),
    accept ? 'invite:accepted' : 'invite:declined',
    `Your team invite was ${accept ? 'accepted' : 'declined'}.`
  );
  res.json({ invite });
});

export const lockTeam = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const team = await Team.findById(id);
  if (!team) throw ApiError.notFound('Team not found');
  if (team.status === 'locked' || team.status === 'active') {
    // One-directional: once locked, no member action can reverse it.
    throw ApiError.conflict('Team is already locked and cannot be reopened by a member action');
  }

  team.status = 'locked';
  team.lockInitiatedBy = req.auth!.userId as unknown as typeof team.lockInitiatedBy;
  team.lockConfirmedAt = new Date();
  await team.save();

  await recordAudit(req.auth!, 'lock', 'Team', team._id, {});
  for (const studentId of team.students) {
    if (studentId.toString() !== req.auth!.userId) {
      await notify('Student', studentId.toString(), 'team:locked', `Team "${team.name}" has been locked.`);
    }
  }
  res.json({ team });
});

export const listMyInvites = asyncHandler(async (req: Request, res: Response) => {
  const invites = await TeamInvite.find({ toStudent: req.auth!.userId, status: 'pending' })
    .populate('teamId', 'name')
    .populate('fromStudent', 'name rollNo')
    .sort({ createdAt: -1 })
    .lean();
  res.json({ invites });
});
