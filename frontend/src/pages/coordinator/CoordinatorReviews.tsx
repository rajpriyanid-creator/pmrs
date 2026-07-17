import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";
import { useReviewRailData } from "../../hooks/useReviewRailData";
import { TeamRailLayout } from "../../components/layout/TeamRailLayout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useToastStore } from "../../store/toastStore";
import type { Team, Review, ReviewType } from "../../types";

/** Coordinator's per-team review scheduling flow, gated by prerequisite completion and clash detection (6.5/6.14). */
export function CoordinatorReviews() {
  const { program } = useAuth();
  const queryClient = useQueryClient();
  const push = useToastStore((s) => s.push);
  const [teamId, setTeamId] = useState("");
  const [form, setForm] = useState({ type: "review1" as ReviewType, scheduledDate: "", scheduledTime: "10:00", durationMinutes: 20 });

  const { data: teams } = useQuery({ queryKey: ["teams", program], queryFn: () => unwrap(api.get<{ data: Team[] }>(`/teams?program=${program}`)), enabled: Boolean(program) });
  const { data: reviews } = useQuery({
    queryKey: ["reviews", teamId],
    queryFn: () => unwrap(api.get<{ data: Review[] }>(`/reviews?teamId=${teamId}`)),
    enabled: Boolean(teamId),
  });

  const nodes = useReviewRailData(reviews);

  const schedule = useMutation({
    mutationFn: () => api.post("/reviews", { teamId, ...form }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", teamId] });
      push("Review scheduled");
    },
    onError: (err: any) => push(err?.response?.data?.error ?? "Could not schedule review", "error"),
  });

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <h1 className="font-display text-2xl">Schedule Reviews</h1>
        <select value={teamId} onChange={(e) => setTeamId(e.target.value)} className="rounded border border-ink/20 px-3 py-2 text-sm">
          <option value="">Select a team…</option>
          {(teams ?? []).map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
        </select>
      </div>

      {teamId && (
        <TeamRailLayout nodes={nodes} activeType={form.type} title="">
          <form
            onSubmit={(e) => { e.preventDefault(); schedule.mutate(); }}
            className="flex max-w-md flex-col gap-3 rounded-lg border border-ink/10 p-5"
          >
            <label className="text-sm font-medium">Review stage</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ReviewType })} className="rounded border border-ink/20 px-3 py-2 text-sm">
              {["review0", "review1", "review2", "review3", "viva"].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <Input label="Date" type="date" value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} required />
            <Input label="Time" type="time" value={form.scheduledTime} onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })} required />
            <Input label="Duration (minutes)" type="number" min={5} max={240} value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })} required />
            <Button type="submit">Schedule</Button>
          </form>
        </TeamRailLayout>
      )}
    </div>
  );
}
