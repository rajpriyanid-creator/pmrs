import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { EmptyState, TableSkeleton } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Card';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Users, User } from 'lucide-react';

function useMyPanel() {
  return useQuery({
    queryKey: ['my-panel'],
    queryFn: async () => {
      // Fetch review panels where the student's team is assigned
      const teamRes = await api.get('/teams');
      const myTeam = teamRes.data.items?.[0];
      if (!myTeam) return null;
      const panelRes = await api.get('/panels/review');
      const panels = panelRes.data.reviewPanels as any[];
      // Find the panel that contains this team
      const myPanel = panels.find((p) =>
        (p.teamIds ?? []).some((tid: any) =>
          (typeof tid === 'string' ? tid : tid._id?.toString?.() ?? String(tid)) === myTeam._id
        )
      );
      return { team: myTeam, panel: myPanel ?? null };
    },
  });
}

export function StudentMyPanelPage() {
  const { data, isLoading } = useMyPanel();

  return (
    <AppShell title="My Panel">
      <PageHeader
        title="My Review Panel"
        description="Your assigned panel members for project reviews."
      />

      {isLoading ? (
        <Card><TableSkeleton /></Card>
      ) : !data?.panel ? (
        <Card>
          <EmptyState
            title="No panel assigned yet"
            description="A panel will be assigned to your team by the admin. Check back later."
          />
        </Card>
      ) : (
        <div className="max-w-2xl space-y-6">
          {/* Team info */}
          <Card>
            <div className="p-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-seal)]/10 flex items-center justify-center">
                <Users size={20} className="text-[var(--color-seal)]" />
              </div>
              <div>
                <p className="text-xs text-[var(--color-ink-faint)] uppercase tracking-wide font-medium">Team</p>
                <p className="font-semibold text-[var(--color-ink)]">{data.team?.name}</p>
              </div>
            </div>
          </Card>

          {/* Coordinator */}
          {data.panel.coordinatorId && (
            <Card>
              <div className="px-5 py-3 border-b border-[var(--color-ink)]/8">
                <h3 className="text-sm font-semibold text-[var(--color-ink)]">Coordinator</h3>
              </div>
              <div className="p-5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--color-verdant)]/10 flex items-center justify-center">
                  <User size={15} className="text-[var(--color-verdant)]" />
                </div>
                <div>
                  <p className="font-medium text-[var(--color-ink)] text-sm">
                    {data.panel.coordinatorId?.name ?? data.panel.coordinatorId}
                  </p>
                  {data.panel.coordinatorId?.email && (
                    <p className="text-xs text-[var(--color-ink-faint)]">{data.panel.coordinatorId.email}</p>
                  )}
                </div>
                <Badge tone="verdant" className="ml-auto">Coordinator</Badge>
              </div>
            </Card>
          )}

          {/* Panel members */}
          {(data.panel.memberIds ?? []).length > 0 && (
            <Card>
              <div className="px-5 py-3 border-b border-[var(--color-ink)]/8">
                <h3 className="text-sm font-semibold text-[var(--color-ink)]">
                  Panel Members ({(data.panel.memberIds ?? []).length})
                </h3>
              </div>
              <ul className="divide-y divide-[var(--color-ink)]/5">
                {(data.panel.memberIds ?? []).map((member: any, i: number) => {
                  const m = typeof member === 'object' ? member : { name: member };
                  return (
                    <li key={i} className="px-5 py-3.5 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--color-seal-dim)] flex items-center justify-center">
                        <span className="text-xs font-semibold text-[var(--color-seal)]">
                          {(m.name ?? '?').slice(0, 1).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--color-ink)]">{m.name ?? '—'}</p>
                        {m.designation && (
                          <p className="text-xs text-[var(--color-ink-faint)]">{m.designation}</p>
                        )}
                      </div>
                      <Badge className="ml-auto">Panel</Badge>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </div>
      )}
    </AppShell>
  );
}
