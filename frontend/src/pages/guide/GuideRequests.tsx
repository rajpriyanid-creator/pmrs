import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { useToastStore } from "../../store/toastStore";

interface RequestRow { _id: string; teamId: { _id: string; name: string } | string; status: string }

/** Guide requests: always-visible role (Section 6.1) - every guide sees this regardless of assignment. */
export function GuideRequests() {
  const queryClient = useQueryClient();
  const push = useToastStore((s) => s.push);
  const { data } = useQuery({ queryKey: ["guide-requests"], queryFn: () => unwrap(api.get<{ data: RequestRow[] }>("/guide-requests")) });

  const decide = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "accepted" | "rejected" }) => api.patch(`/guide-requests/${id}/decision`, { status }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["guide-requests"] }); push("Request updated"); },
  });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">Guide Requests</h1>
      <div className="flex flex-col gap-3">
        {(data ?? []).filter((r) => r.status === "pending").map((r) => (
          <Card key={r._id} className="flex items-center justify-between">
            <p>{typeof r.teamId === "object" ? r.teamId.name : "Team"}</p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => decide.mutate({ id: r._id, status: "rejected" })}>Decline</Button>
              <Button onClick={() => decide.mutate({ id: r._id, status: "accepted" })}>Accept</Button>
            </div>
          </Card>
        ))}
        {(data ?? []).filter((r) => r.status === "pending").length === 0 && (
          <p className="text-sm text-ink/50">No pending requests right now.</p>
        )}
      </div>
    </div>
  );
}
