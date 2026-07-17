import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, Badge } from '@/components/ui/Card';
import { ReviewRail } from '@/components/reviewrail/ReviewRail';
import { Table, THead, TH, TR, TD, EmptyState } from '@/components/ui/Table';
import { useTeamList } from '@/api/teams';
import { useTeamReviews } from '@/api/reviews';
import { useMarksSummary } from '@/api/marks';
import { REVIEW_LABELS, ReviewType } from '@/types';

export function StudentReviewsPage() {
  const { data: teamsData } = useTeamList();
  const myTeam = teamsData?.items[0];
  const { data: reviews } = useTeamReviews(myTeam?._id);
  const { data: marksData } = useMarksSummary(myTeam?._id);

  if (!myTeam) {
    return (
      <AppShell title="Reviews & Marks">
        <EmptyState title="No team yet" description="Create or join a team to see your review schedule." />
      </AppShell>
    );
  }

  const averages: Record<string, number> = {};
  marksData?.summaries.forEach((s) => {
    const type = typeof s.reviewId === 'object' ? s.reviewId.type : undefined;
    if (type) averages[type] = s.average;
  });

  return (
    <AppShell title="Reviews & Marks">
      <PageHeader title="Reviews & Marks" description={myTeam.name} />

      <Card className="mb-6">
        <CardHeader title="Review Progress" />
        <div className="p-6">{reviews && <ReviewRail reviews={reviews} averages={averages} />}</div>
      </Card>

      <Card>
        <CardHeader title="Published Marks" subtitle="Overall average recomputes automatically as reviews are confirmed" />
        {!marksData || marksData.summaries.length === 0 ? (
          <EmptyState title="No marks published yet" />
        ) : (
          <>
            <div className="px-6 pt-5 pb-2 flex items-center gap-3">
              <span className="text-sm text-[var(--color-ink-faint)]">Overall average</span>
              <span className="font-display text-2xl text-[var(--color-verdant)]">{marksData.overall.toFixed(1)}</span>
            </div>
            <Table>
              <THead>
                <tr>
                  <TH>Review</TH>
                  <TH>Average</TH>
                </tr>
              </THead>
              <tbody>
                {marksData.summaries.map((s, i) => {
                  const type = (typeof s.reviewId === 'object' ? s.reviewId.type : undefined) as ReviewType | undefined;
                  return (
                    <TR key={i}>
                      <TD className="font-medium">{type ? REVIEW_LABELS[type] : '—'}</TD>
                      <TD>
                        <Badge tone="verdant">{s.average.toFixed(1)}</Badge>
                      </TD>
                    </TR>
                  );
                })}
              </tbody>
            </Table>
          </>
        )}
      </Card>
    </AppShell>
  );
}
