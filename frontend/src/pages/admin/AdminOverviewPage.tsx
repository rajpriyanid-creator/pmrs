import { AppShell } from '@/components/layout/AppShell';
import { PageHeader, StatCard } from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Link } from 'react-router-dom';
import { UserCog, Users, GitBranch, ClipboardCheck } from 'lucide-react';
import { useFacultyList } from '@/api/faculty';
import { useTeamList } from '@/api/teams';

export function AdminOverviewPage() {
  const { data: faculty } = useFacultyList();
  const { data: teams } = useTeamList();

  const unassigned = teams?.items.filter((t) => !t.guideId).length ?? 0;

  return (
    <AppShell title="Overview">
      <PageHeader title="Institutional Overview" description="Snapshot of the current review cycle across all programs." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Faculty" value={faculty?.pagination.total ?? '—'} />
        <StatCard label="Teams" value={teams?.pagination.total ?? '—'} tone="verdant" />
        <StatCard label="Unassigned Guides" value={unassigned} tone={unassigned > 0 ? 'flag' : 'verdant'} />
        <StatCard label="Programs" value={4} tone="seal" />
      </div>

      <Card>
        <CardHeader title="Quick actions" subtitle="Jump straight into the most common admin tasks" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 p-6">
          <QuickLink to="/admin/faculty" icon={UserCog} label="Manage Faculty" />
          <QuickLink to="/admin/students" icon={Users} label="Manage Students" />
          <QuickLink to="/admin/allocations" icon={GitBranch} label="Allocation Dashboard" />
          <QuickLink to="/admin/attendance" icon={ClipboardCheck} label="View Attendance" />
        </div>
      </Card>
    </AppShell>
  );
}

function QuickLink({ to, icon: Icon, label }: { to: string; icon: typeof UserCog; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 p-4 rounded-lg border border-[var(--color-ink)]/8 hover:border-[var(--color-seal)]/40 hover:bg-[var(--color-paper-dim)]/50 transition-colors"
    >
      <div className="h-9 w-9 rounded-lg bg-[var(--color-seal-dim)] text-[var(--color-seal)] flex items-center justify-center shrink-0">
        <Icon size={17} />
      </div>
      <span className="text-sm font-medium text-[var(--color-ink)]">{label}</span>
    </Link>
  );
}
