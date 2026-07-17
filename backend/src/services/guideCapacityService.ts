import { Team } from '../models/Team';
import { Program } from '../models/Program';
import { Types } from 'mongoose';

export async function getGuideCapacity(guideId: Types.ObjectId | string, limits: { ug: number; pg: number }) {
  const ugPrograms = await Program.find({ type: 'UG' }).select('_id').lean();
  const pgPrograms = await Program.find({ type: 'PG' }).select('_id').lean();

  const [ugAccepted, pgAccepted] = await Promise.all([
    Team.countDocuments({ guideId, program: { $in: ugPrograms.map((p) => p._id) } }),
    Team.countDocuments({ guideId, program: { $in: pgPrograms.map((p) => p._id) } }),
  ]);

  return {
    ug: { accepted: ugAccepted, limit: limits.ug, remaining: Math.max(0, limits.ug - ugAccepted) },
    pg: { accepted: pgAccepted, limit: limits.pg, remaining: Math.max(0, limits.pg - pgAccepted) },
  };
}

export async function hasCapacity(
  guideId: Types.ObjectId | string,
  limits: { ug: number; pg: number },
  programType: 'UG' | 'PG'
): Promise<boolean> {
  const capacity = await getGuideCapacity(guideId, limits);
  return programType === 'UG' ? capacity.ug.remaining > 0 : capacity.pg.remaining > 0;
}
