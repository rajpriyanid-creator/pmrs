import { Card } from '@/components/ui/Card';
import { ReviewRail } from '@/components/reviewrail/ReviewRail';
import { useTeamReviews } from '@/api/reviews';
import { useMarksSummary } from '@/api/marks';
import { Team, ReviewType } from '@/types';
import { ReactNode } from 'react';

export function TeamCard({ team, action }: { team: Team; action?: ReactNode }) {
  const { data: reviews } = useTeamReviews(team._id);
  const { data: marksSummary } = useMarksSummary(team._id);

  const averages: Record<string, number> = {};
  marksSummary?.summaries.forEach((s) => {
    const type = typeof s.reviewId === 'object' ? s.reviewId.type : undefined;
    if (type) averages[type] = s.average;
  });

  const studentNames = Array.isArray(team.students)
    ? (team.students as any[]).map((s) => (typeof s === 'object' ? s.name : s)).join(', ')
    : '';

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-1">
        <div>
          <p className="font-display text-base text-[var(--color-ink)]">{team.name}</p>
          <p className="text-xs text-[var(--color-ink-faint)] mt-0.5">{studentNames}</p>
        </div>
        {action}
      </div>
      <div className="mt-4">
        {reviews ? (
          <ReviewRail reviews={reviews} averages={averages} onSelect={(_t: ReviewType) => {}} />
        ) : (
          <div className="h-16 animate-pulse bg-[var(--color-ink)]/5 rounded-lg" />
        )}
      </div>
    </Card>
  );
}
