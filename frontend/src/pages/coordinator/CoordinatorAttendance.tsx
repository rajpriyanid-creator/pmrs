import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../../components/ui/Button";
import { useToastStore } from "../../store/toastStore";
import type { Team, Review } from "../../types";

/** Attendance write access is Coordinator-only (Section 6.6); Admin/others are read-only. */
export function CoordinatorAttendance() {
  const { program } = useAuth();
  const queryClient = useQueryClient();
  const push = useToastStore((s) => s.push);
  const [teamId, setTeamId] = useState("");
  const [reviewId, setReviewId] = useState("");
  const [present, setPresent] = useState<Record<string, boolean>>({});

  const { data: teams } = useQuery({ queryKey: ["teams", program], queryFn: () => unwrap(api.get<{ data: Team[] }>(`/teams?program=${program}`)), enabled: Boolean(program) });
  const { data: reviews } = useQuery({ queryKey: ["reviews", teamId], queryFn: () => unwrap(api.get<{ data: Review[] }>(`/reviews?teamId=${teamId}`)), enabled: Boolean(teamId) });

  const team = teams?.find((t) => t._id === teamId);

  const submit = useMutation({
    mutationFn: () => api.post("/attendance", {
      teamId, reviewId, kind: "review",
      reviewDate: new Date().toISOString(),
      perStudent: (team?.students ?? []).map((s) => ({ studentId: s._id, present: present[s._id] ?? false })),
    }),
    onSuccess: () => { push("Attendance recorded"); queryClient.invalidateQueries({ queryKey: ["attendance"] }); },
  });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">Attendance</h1>
      <div className="mb-4 flex gap-3">
        <select value={teamId} onChange={(e) => { setTeamId(e.target.value); setReviewId(""); }} className="rounded border border-ink/20 px-3 py-2 text-sm">
          <option value="">Select a team…</option>
          {(teams ?? []).map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
        </select>
        <select value={reviewId} onChange={(e) => setReviewId(e.target.value)} className="rounded border border-ink/20 px-3 py-2 text-sm" disabled={!teamId}>
          <option value="">Select a review…</option>
          {(reviews ?? []).map((r) => <option key={r._id} value={r._id}>{r.type}</option>)}
        </select>
      </div>

      {team && reviewId && (
        <div className="max-w-md rounded-lg border border-ink/10 p-5">
          {team.students.map((s) => (
            <label key={s._id} className="ledger-row flex items-center justify-between text-sm">
              <span>{s.name} <span className="font-mono text-ink/40">({s.rollNo})</span></span>
              <input type="checkbox" checked={present[s._id] ?? false} onChange={(e) => setPresent((p) => ({ ...p, [s._id]: e.target.checked }))} />
            </label>
          ))}
          <Button className="mt-4" onClick={() => submit.mutate()}>Submit attendance</Button>
        </div>
      )}
    </div>
  );
}
