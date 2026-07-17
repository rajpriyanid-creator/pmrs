import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { EmptyState, TableSkeleton } from '@/components/ui/Table';
import { useMarkNotificationRead, useNotifications } from '@/api/notifications';

export function StudentNotificationsPage() {
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();

  return (
    <AppShell title="Notifications">
      <PageHeader title="Notifications" />

      <Card>
        {isLoading ? (
          <TableSkeleton rows={5} cols={1} />
        ) : !data || data.items.length === 0 ? (
          <EmptyState title="You're all caught up" />
        ) : (
          <div className="divide-y divide-[var(--color-ink)]/8">
            {data.items.map((n) => (
              <button
                key={n._id}
                onClick={() => !n.read && markRead.mutate(n._id)}
                className={`w-full text-left px-6 py-4 hover:bg-[var(--color-paper-dim)]/60 transition-colors ${
                  !n.read ? 'bg-[var(--color-seal-dim)]/30' : ''
                }`}
              >
                <p className="text-sm text-[var(--color-ink)]">{n.message}</p>
                <p className="text-xs text-[var(--color-ink-faint)] mt-1">
                  {new Date(n.createdAt).toLocaleString(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </button>
            ))}
          </div>
        )}
      </Card>
    </AppShell>
  );
}
