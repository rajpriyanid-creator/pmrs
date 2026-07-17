import { MarksEntry, MarksSummary } from '../models/Marks';
import { Types } from 'mongoose';

/** Recomputes and caches the average/breakdown for one team+review after any confirmed entry changes. */
export async function recomputeReviewSummary(teamId: Types.ObjectId | string, reviewId: Types.ObjectId | string) {
  const entries = await MarksEntry.find({ teamId, reviewId, confirmed: true }).lean();
  if (entries.length === 0) {
    await MarksSummary.findOneAndUpdate(
      { teamId, reviewId },
      { teamId, reviewId, average: 0, breakdown: [] },
      { upsert: true }
    );
    return { average: 0, breakdown: [] };
  }

  // Each entry total is out of 40; convert to percentage (0-100)
  const percentages = entries.map((e) => {
    const total = e.mark1 + e.mark2 + e.mark3 + e.mark4;
    return Math.round((total / 40) * 10000) / 100;
  });

  const average = Math.round((percentages.reduce((sum, p) => sum + p, 0) / percentages.length) * 100) / 100;

  const breakdown = entries.map((e, i) => ({
    role: e.role,
    studentId: e.studentId.toString(),
    percentage: percentages[i],
  }));

  await MarksSummary.findOneAndUpdate({ teamId, reviewId }, { teamId, reviewId, average, breakdown }, { upsert: true });
  return { average, breakdown };
}

/** Overall average across every review that has a cached summary for the team. */
export async function getOverallTeamAverage(teamId: Types.ObjectId | string): Promise<number> {
  const summaries = await MarksSummary.find({ teamId }).lean();
  const withScores = summaries.filter((s) => s.average > 0);
  if (withScores.length === 0) return 0;
  const total = withScores.reduce((sum, s) => sum + s.average, 0);
  return Math.round((total / withScores.length) * 100) / 100;
}
