import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "../../lib/api";
import type { Notification } from "../../types";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["notifications", "full"],
    queryFn: () => unwrap(api.get<{ data: Notification[] }>("/notifications?limit=50")),
  });

  const markAllRead = useMutation({
    mutationFn: () => api.patch("/notifications/read-all"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl">Notifications</h1>
        <Button variant="secondary" onClick={() => markAllRead.mutate()}>Mark all read</Button>
      </div>
      <div className="flex flex-col gap-2">
        {(data ?? []).map((n) => (
          <Card key={n._id} className={n.read ? "opacity-60" : ""}>
            <p className="text-sm">{n.message}</p>
            <p className="mt-1 text-xs text-ink/40">{new Date(n.createdAt).toLocaleString()}</p>
          </Card>
        ))}
        {data?.length === 0 && <p className="text-sm text-ink/50">You're all caught up.</p>}
      </div>
    </div>
  );
}
