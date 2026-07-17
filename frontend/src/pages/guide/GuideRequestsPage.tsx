import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Card';
import { EmptyState, TableSkeleton } from '@/components/ui/Table';
import { Check, X } from 'lucide-react';
import { useGuideRequests, useRespondToGuideRequest } from '@/api/guideRequests';
import { toast } from '@/components/ui/Toast';
import { apiErrorMessage } from '@/api/client';

export function GuideRequestsPage() {
  const { data, isLoading } = useGuideRequests();
  const respond = useRespondToGuideRequest();

  async function handleRespond(id: string, accept: boolean) {
    try {
      await respond.mutateAsync({ id, accept });
      toast.success(accept ? 'Request accepted.' : 'Request declined.');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  const pending = data?.filter((r) => r.status === 'pending') ?? [];
  const resolved = data?.filter((r) => r.status !== 'pending') ?? [];

  return (
    <AppShell title="Guide Requests">
      <PageHeader title="Guide Requests" description="Teams requesting you as their project guide." />

      <Card className="mb-6">
        {isLoading ? (
          <TableSkeleton rows={3} cols={2} />
        ) : pending.length === 0 ? (
          <EmptyState title="No pending requests" description="New requests from teams will appear here." />
        ) : (
          <div className="divide-y divide-[var(--color-ink)]/8">
            {pending.map((req) => (
              <div key={req._id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="font-medium text-sm text-[var(--color-ink)]">
                    {typeof req.teamId === 'object' ? req.teamId.name : 'Team'}
                  </p>
                  <p className="text-xs text-[var(--color-ink-faint)]">{new Date(req.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="success" onClick={() => handleRespond(req._id, true)} loading={respond.isPending}>
                    <Check size={14} /> Accept
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleRespond(req._id, false)} loading={respond.isPending}>
                    <X size={14} /> Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {resolved.length > 0 && (
        <Card>
          <div className="px-5 py-3 border-b border-[var(--color-ink)]/8">
            <p className="text-sm font-medium text-[var(--color-ink-soft)]">History</p>
          </div>
          <div className="divide-y divide-[var(--color-ink)]/8">
            {resolved.map((req) => (
              <div key={req._id} className="flex items-center justify-between px-5 py-3">
                <p className="text-sm text-[var(--color-ink)]">{typeof req.teamId === 'object' ? req.teamId.name : 'Team'}</p>
                <Badge tone={req.status === 'accepted' ? 'verdant' : 'flag'}>{req.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </AppShell>
  );
}
