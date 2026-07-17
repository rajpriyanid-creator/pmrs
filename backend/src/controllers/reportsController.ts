import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { FinalReport } from '../models/FinalReport';
import { Team } from '../models/Team';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { notify } from '../services/notificationService';
import path from 'path';
import fs from 'fs';

/** POST /reports/upload — student uploads their team's final report. */
export const uploadReport = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest('No file uploaded');
  const auth = req.auth!;
  if (auth.userModel !== 'Student') throw ApiError.forbidden('Only students may upload reports');

  // Find the team this student belongs to
  const team = await Team.findOne({ students: new Types.ObjectId(auth.userId) });
  if (!team) throw ApiError.notFound('You are not part of any team');
  if (team.status === 'forming') {
    throw ApiError.badRequest('Your team is still forming. Please lock your team before uploading the final report.');
  }

  const existing = await FinalReport.findOne({ teamId: team._id });
  let rejections: any[] = existing?.rejections ?? [];

  if (existing) {
    if (existing.status === 'rejected') {
      // Archive current rejected file into rejections history
      rejections.push({
        filePath: existing.filePath,
        filename: existing.filename,
        remarks: existing.remarks || 'No remarks provided',
        rejectedAt: existing.updatedAt || new Date(),
      });
    } else {
      try { fs.unlinkSync(existing.filePath); } catch { /* ignore */ }
    }
    await FinalReport.findByIdAndDelete(existing._id);
  }

  const report = await FinalReport.create({
    teamId: team._id,
    uploadedBy: auth.userId,
    filePath: req.file.path,
    filename: req.file.originalname,
    mimeType: req.file.mimetype,
    status: 'uploaded',
    remarks: '',
    rejections,
  });

  if (team.guideId) {
    await notify('Faculty', team.guideId.toString(), 'report:uploaded', `Team "${team.name}" has uploaded their final report.`);
  }

  res.status(201).json({ report: { ...report.toObject(), filePath: undefined } });
});

/** GET /reports — list reports for the caller's scope. */
export const listReports = asyncHandler(async (req: Request, res: Response) => {
  const auth = req.auth!;
  let reports: any[] = [];

  if (auth.role === 'guide') {
    const teams = await Team.find({ guideId: auth.userId }).select('_id').lean();
    const teamIds = teams.map((t) => t._id);
    if (teamIds.length === 0) return res.json({ reports: [] });
    reports = await FinalReport.find({ teamId: teamIds.length === 1 ? teamIds[0] : { $in: teamIds } })
      .populate('teamId', 'name')
      .populate('uploadedBy', 'name rollNo')
      .populate('approvedBy', 'name')
      .lean();
  } else if (auth.role === 'admin' || auth.role === 'coordinator') {
    reports = await FinalReport.find()
      .populate('teamId', 'name')
      .populate('uploadedBy', 'name rollNo')
      .populate('approvedBy', 'name')
      .lean();
  } else if (auth.userModel === 'Student') {
    const team = await Team.findOne({ students: auth.userId }).select('_id').lean();
    if (!team) return res.json({ reports: [] });
    reports = await FinalReport.find({ teamId: team._id })
      .populate('teamId', 'name')
      .populate('uploadedBy', 'name rollNo')
      .populate('approvedBy', 'name')
      .lean();
  } else {
    throw ApiError.forbidden('Not authorised to view reports');
  }

  const safe = reports.map((r) => ({ ...r, filePath: undefined }));
  res.json({ reports: safe });
});

/** GET /reports/:id/download — download report file. */
export const downloadReport = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const auth = req.auth!;

  const report = await FinalReport.findById(id).populate('teamId').lean() as any;
  if (!report) throw ApiError.notFound('Report not found');

  const team = report.teamId;
  const isGuide = auth.role === 'guide' && team?.guideId?.toString() === auth.userId;
  const isAdminOrCoord = auth.role === 'admin' || auth.role === 'coordinator';
  const isStudentMember = auth.userModel === 'Student' && team?.students?.some((s: any) => s.toString() === auth.userId);

  if (!isGuide && !isAdminOrCoord && !isStudentMember) {
    throw ApiError.forbidden('You are not authorized to download this report');
  }

  const absolutePath = path.isAbsolute(report.filePath)
    ? report.filePath
    : path.resolve(process.cwd(), report.filePath);

  if (!fs.existsSync(absolutePath)) {
    throw ApiError.notFound(`Report file not found on disk: ${absolutePath}`);
  }

  res.download(absolutePath, report.filename);
});

/** PATCH /reports/:id/approve — guide approves a final report. */
export const approveReport = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const auth = req.auth!;

  if (auth.role !== 'guide') throw ApiError.forbidden('Only guides may approve reports');

  const report = await FinalReport.findById(id).populate('teamId', 'guideId students').lean() as any;
  if (!report) throw ApiError.notFound('Report not found');
  if (report.teamId?.guideId?.toString() !== auth.userId) {
    throw ApiError.forbidden('You are not the guide for this team');
  }

  const updated = await FinalReport.findByIdAndUpdate(
    id,
    { status: 'approved', approvedBy: auth.userId, approvedAt: new Date(), remarks: '' },
    { new: true }
  );

  for (const studentId of (report.teamId?.students ?? [])) {
    await notify('Student', studentId.toString(), 'report:approved', 'Your final report has been approved by your guide.');
  }

  res.json({ report: { ...updated?.toObject(), filePath: undefined } });
});

/** PATCH /reports/:id/reject — guide rejects a final report with remarks. */
export const rejectReport = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { remarks } = req.body as { remarks?: string };
  const auth = req.auth!;

  if (auth.role !== 'guide') throw ApiError.forbidden('Only guides may reject reports');

  const report = await FinalReport.findById(id).populate('teamId', 'guideId students').lean() as any;
  if (!report) throw ApiError.notFound('Report not found');
  if (report.teamId?.guideId?.toString() !== auth.userId) {
    throw ApiError.forbidden('You are not the guide for this team');
  }

  const updated = await FinalReport.findByIdAndUpdate(
    id,
    {
      status: 'rejected',
      remarks: remarks || 'Report rejected. Please update and re-upload.',
      approvedBy: null,
      approvedAt: null,
    },
    { new: true }
  );

  for (const studentId of (report.teamId?.students ?? [])) {
    await notify('Student', studentId.toString(), 'report:rejected', `Your final report was rejected by your guide. Remarks: ${remarks || 'Needs revision'}`);
  }

  res.json({ report: { ...updated?.toObject(), filePath: undefined } });
});
