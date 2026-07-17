import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/Table';
import { TeamCard } from '@/components/TeamCard';
import { useTeamList } from '@/api/teams';

export function PanelOverviewPage() {
  const { data, isLoading } = useTeamList();

  return (
    <AppShell title="Assigned Teams">
      <PageHeader title="Assigned Teams" description="Teams you are evaluating as a panel member." />

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[0, 1].map((i) => (
            <div key={i} className="h-40 animate-pulse bg-[var(--color-ink)]/5 rounded-xl" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="No teams assigned yet" description="The admin allocation dashboard assigns panel members to teams." />
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
