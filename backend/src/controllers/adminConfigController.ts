import { Request, Response } from 'express';
import { AdminConfig } from '../models/AdminConfig';
import { Team } from '../models/Team';
import { Student } from '../models/Student';
import { Faculty } from '../models/Faculty';
import { RefreshToken } from '../models/RefreshToken';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { recordAudit } from '../services/auditService';

/** GET /admin-config — returns (or creates) the singleton config document. */
export const getConfig = asyncHandler(async (_req: Request, res: Response) => {
  let config = await AdminConfig.findOne();
  if (!config) config = await AdminConfig.create({});
  res.json({ config });
});

/** PATCH /admin-config — update guide-selection window / team-formation toggle. */
export const updateConfig = asyncHandler(async (req: Request, res: Response) => {
  const { guideSelectionOpen, guideSelectionWindowStart, guideSelectionWindowEnd, teamFormationOpen } = req.body;
  let config = await AdminConfig.findOne();
  if (!config) config = await AdminConfig.create({});

  if (typeof guideSelectionOpen === 'boolean') config.guideSelectionOpen = guideSelectionOpen;
  if (guideSelectionWindowStart !== undefined) config.guideSelectionWindowStart = guideSelectionWindowStart ? new Date(guideSelectionWindowStart) : null;
  if (guideSelectionWindowEnd !== undefined) config.guideSelectionWindowEnd = guideSelectionWindowEnd ? new Date(guideSelectionWindowEnd) : null;
  if (typeof teamFormationOpen === 'boolean') config.teamFormationOpen = teamFormationOpen;

  await config.save();
  await recordAudit(req.auth!, 'update', 'AdminConfig', config._id, req.body);
  res.json({ config });
});

// ─── Danger Zone bulk-delete endpoints ───────────────────────────────────────

/** DELETE /admin-config/danger/all-teams — deletes every team. */
export const deleteAllTeams = asyncHandler(async (req: Request, res: Response) => {
  const result = await Team.deleteMany({});
  await recordAudit(req.auth!, 'danger:delete-all-teams', 'Team', 'bulk', { deleted: result.deletedCount });
  res.json({ deleted: result.deletedCount });
});

/** DELETE /admin-config/danger/solo-teams — deletes teams with exactly 1 student. */
export const deleteAllSoloTeams = asyncHandler(async (req: Request, res: Response) => {
  // Find solo teams by checking students array size
  const soloTeams = await Team.find({ $expr: { $eq: [{ $size: '$students' }, 1] } }).select('_id');
  const ids = soloTeams.map((t) => t._id);
  const result = await Team.deleteMany({ _id: { $in: ids } });
  await recordAudit(req.auth!, 'danger:delete-solo-teams', 'Team', 'bulk', { deleted: result.deletedCount });
  res.json({ deleted: result.deletedCount });
});

/** DELETE /admin-config/danger/all-students — deletes every student account. */
export const deleteAllStudents = asyncHandler(async (req: Request, res: Response) => {
  const result = await Student.deleteMany({});
  await RefreshToken.deleteMany({ userModel: 'Student' });
  await recordAudit(req.auth!, 'danger:delete-all-students', 'Student', 'bulk', { deleted: result.deletedCount });
  res.json({ deleted: result.deletedCount });
});

/** DELETE /admin-config/danger/all-faculty — deletes all non-admin faculty. */
export const deleteAllFaculty = asyncHandler(async (req: Request, res: Response) => {
  const result = await Faculty.deleteMany({ isAdmin: false });
  await RefreshToken.deleteMany({ userModel: 'Faculty' });
  await recordAudit(req.auth!, 'danger:delete-all-faculty', 'Faculty', 'bulk', { deleted: result.deletedCount });
  res.json({ deleted: result.deletedCount });
});

/** DELETE /admin-config/danger/user/:id — deletes a specific user (Faculty or Student). */
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { model } = req.query as { model: 'Faculty' | 'Student' };

  if (!['Faculty', 'Student'].includes(model)) throw ApiError.badRequest('model must be Faculty or Student');

  if (model === 'Faculty') {
    const faculty = await Faculty.findById(id);
    if (!faculty) throw ApiError.notFound('Faculty not found');
    if (faculty.isAdmin && req.auth?.userId === id) throw ApiError.forbidden('Cannot delete your own admin account');
    await Faculty.findByIdAndDelete(id);
    await RefreshToken.deleteMany({ userId: id, userModel: 'Faculty' });
    await recordAudit(req.auth!, 'danger:delete-user', 'Faculty', faculty._id, { name: faculty.name });
  } else {
    const student = await Student.findById(id);
    if (!student) throw ApiError.notFound('Student not found');
    await Student.findByIdAndDelete(id);
    await RefreshToken.deleteMany({ userId: id, userModel: 'Student' });
    await recordAudit(req.auth!, 'danger:delete-user', 'Student', student._id, { name: student.name });
  }

  res.json({ ok: true });
});
