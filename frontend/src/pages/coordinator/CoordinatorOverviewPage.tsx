import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/Table';
import { TeamCard } from '@/components/TeamCard';
import { useTeamList } from '@/api/teams';

export function CoordinatorOverviewPage() {
  const { data, isLoading } = useTeamList();

  return (
    <AppShell title="Overview">
      <PageHeader title="Coordinator Overview" description="Teams under your review panel." />

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[0, 1].map((i) => (
            <div key={i} className="h-40 animate-pulse bg-[var(--color-ink)]/5 rounded-xl" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="No teams assigned yet" description="The admin allocation dashboard assigns teams to your panel." />
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
