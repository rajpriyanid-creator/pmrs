import { Request, Response } from 'express';
import { GuideRequest } from '../models/GuideRequest';
import { Team } from '../models/Team';
import { Faculty } from '../models/Faculty';
import { Program } from '../models/Program';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { getGuideCapacity } from '../services/guideCapacityService';
import { notify } from '../services/notificationService';
import { cacheInvalidatePrefix } from '../services/cacheService';

export const createGuideRequest = asyncHandler(async (req: Request, res: Response) => {
  const { teamId, guideId } = req.body as { teamId: string; guideId: string };
  const team = await Team.findById(teamId);
  if (!team) throw ApiError.notFound('Team not found');

  const guide = await Faculty.findById(guideId);
  if (!guide) throw ApiError.notFound('Guide not found');

  const program = await Program.findById(team.program);
  if (!program) throw ApiError.badRequest('Team has no valid program');

  const capacity = await getGuideCapacity(guide._id, guide.guideLimits);
  const relevant = program.type === 'UG' ? capacity.ug : capacity.pg;
  if (relevant.remaining <= 0) throw ApiError.conflict(`This guide has no remaining ${program.type} capacity`);

  const request = await GuideRequest.create({ teamId, guideId, program: team.program, status: 'pending' });
  await notify('Faculty', guideId, 'guide-request:new', `New guide request from team "${team.name}".`);
  res.status(201).json({ request });
});

export const respondToGuideRequest = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { accept } = req.body as { accept: boolean };
  const request = await GuideRequest.findById(id);
  if (!request) throw ApiError.notFound('Request not found');
  if (request.guideId.toString() !== req.auth!.userId) throw ApiError.forbidden('Not your request to respond to');
  if (request.status !== 'pending') throw ApiError.conflict('Already responded to');

  if (accept) {
    const guide = await Faculty.findById(request.guideId);
    const program = await Program.findById(request.program);
    if (!guide || !program) throw ApiError.badRequest('Invalid guide/program state');
    const capacity = await getGuideCapacity(guide._id, guide.guideLimits);
    const relevant = program.type === 'UG' ? capacity.ug : capacity.pg;
    if (relevant.remaining <= 0) throw ApiError.conflict(`No remaining ${program.type} capacity`);

    await Team.findByIdAndUpdate(request.teamId, { guideId: request.guideId });
    await cacheInvalidatePrefix(`allocations:${request.program.toString()}`);
  }

  request.status = accept ? 'accepted' : 'rejected';
  await request.save();

  const team = await Team.findById(request.teamId);
  if (team) {
    for (const studentId of team.students) {
      await notify(
        'Student',
        studentId.toString(),
        accept ? 'guide-request:accepted' : 'guide-request:rejected',
        `Your guide request was ${accept ? 'accepted' : 'rejected'}.`
      );
    }
  }
  res.json({ request });
});

export const getGuideLimits = asyncHandler(async (req: Request, res: Response) => {
  const guideId = (req.query.guideId as string) || req.auth!.userId;
  const guide = await Faculty.findById(guideId);
  if (!guide) throw ApiError.notFound('Guide not found');
  const capacity = await getGuideCapacity(guide._id, guide.guideLimits);
  res.json({ capacity });
});

export const listGuideRequests = asyncHandler(async (req: Request, res: Response) => {
  const guideId = req.auth!.role === 'admin' ? (req.query.guideId as string) : req.auth!.userId;
  if (!guideId) throw ApiError.badRequest('guideId is required');
  const status = req.query.status as string | undefined;
  const filter: Record<string, unknown> = { guideId };
  if (status) filter.status = status;
  const requests = await GuideRequest.find(filter).populate('teamId', 'name').sort({ createdAt: -1 }).lean();
  res.json({ requests });
});
