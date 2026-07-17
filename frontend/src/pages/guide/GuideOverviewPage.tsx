import { AppShell } from '@/components/layout/AppShell';
import { PageHeader, StatCard } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/Table';
import { TeamCard } from '@/components/TeamCard';
import { useTeamList } from '@/api/teams';
import { useGuideCapacity } from '@/api/guideRequests';

export function GuideOverviewPage() {
  const { data, isLoading } = useTeamList();
  const { data: capacity } = useGuideCapacity();

  return (
    <AppShell title="My Teams">
      <PageHeader title="My Teams" description="Teams you are guiding, with live review-cycle progress." />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="UG Capacity" value={capacity ? `${capacity.ug.accepted}/${capacity.ug.limit}` : '—'} tone="seal" />
        <StatCard label="PG Capacity" value={capacity ? `${capacity.pg.accepted}/${capacity.pg.limit}` : '—'} tone="verdant" />
        <StatCard label="Teams" value={data?.pagination.total ?? '—'} />
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[0, 1].map((i) => (
            <div key={i} className="h-40 animate-pulse bg-[var(--color-ink)]/5 rounded-xl" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="No teams yet" description="Accept a guide request to start mentoring a team." />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {data.items.map((team) => (
            <TeamCard key={team._id} team={team} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
