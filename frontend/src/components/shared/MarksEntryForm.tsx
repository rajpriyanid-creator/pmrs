import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "../../lib/api";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { useToastStore } from "../../store/toastStore";
import type { Team, Review } from "../../types";

const CRITERIA_LABELS = ["Problem Definition", "Methodology", "Implementation", "Presentation & Q&A"];

/** Shared by Guide, Panel, and Coordinator (as a marker role) - rubric marks entry (Section 6.15). */
export function MarksEntryForm() {
  const queryClient = useQueryClient();
  const push = useToastStore((s) => s.push);
  const [teamId, setTeamId] = useState("");
  const [reviewId, setReviewId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [scores, setScores] = useState<number[]>([0, 0, 0, 0]);
  const [confirmed, setConfirmed] = useState(false);

  const { data: teams } = useQuery({ queryKey: ["teams", "mine"], queryFn: () => unwrap(api.get<{ data: Team[] }>("/teams")) });
  const { data: reviews } = useQuery({ queryKey: ["reviews", teamId], queryFn: () => unwrap(api.get<{ data: Review[] }>(`/reviews?teamId=${teamId}`)), enabled: Boolean(teamId) });
  const team = teams?.find((t) => t._id === teamId);
  const selectedReview = reviews?.find((r) => r._id === reviewId);

  const submit = useMutation({
    mutationFn: () => api.post("/marks", {
      teamId, reviewId, studentId,
      criteria: CRITERIA_LABELS.map((label, i) => ({ label, score: scores[i] })),
      confirmed: true,
    }),
    onSuccess: () => {
      push("Marks submitted");
      queryClient.invalidateQueries({ queryKey: ["marks"] });
      setScores([0, 0, 0, 0]); setConfirmed(false);
    },
    onError: () => push("Could not submit marks", "error"),
  });

  const total = scores.reduce((a, b) => a + b, 0);

  return (
    <div className="max-w-lg">
      <div className="mb-4 flex flex-col gap-2">
        <select value={teamId} onChange={(e) => { setTeamId(e.target.value); setReviewId(""); setStudentId(""); }} className="rounded border border-ink/20 px-3 py-2 text-sm">
          <option value="">Select a team…</option>
          {(teams ?? []).map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
        </select>
        <select value={reviewId} onChange={(e) => setReviewId(e.target.value)} className="rounded border border-ink/20 px-3 py-2 text-sm" disabled={!teamId}>
          <option value="">Select a review stage…</option>
          {(reviews ?? []).filter((r) => r.hasMarks).map((r) => <option key={r._id} value={r._id}>{r.type}</option>)}
        </select>
        <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="rounded border border-ink/20 px-3 py-2 text-sm" disabled={!teamId}>
          <option value="">Select a student…</option>
          {(team?.students ?? []).map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
      </div>

      {selectedReview && studentId && (
        <Card>
          {CRITERIA_LABELS.map((label, i) => (
            <div key={label} className="ledger-row flex items-center justify-between">
              <span className="text-sm">{label}</span>
              <input
                type="number" min={0} max={10} value={scores[i]}
                onChange={(e) => setScores((prev) => prev.map((v, j) => (j === i ? Math.min(10, Math.max(0, Number(e.target.value))) : v)))}
                className="w-16 rounded border border-ink/20 px-2 py-1 text-right font-mono"
              />
            </div>
          ))}
          <div className="mt-3 flex items-center justify-between font-medium">
            <span>Total</span>
            <span className="font-mono">{total}/40 ({Math.round((total / 40) * 100)}%)</span>
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
            I confirm these scores are final
          </label>
          <Button className="mt-4" disabled={!confirmed} onClick={() => submit.mutate()}>Submit marks</Button>
        </Card>
      )}
    </div>
  );
}
