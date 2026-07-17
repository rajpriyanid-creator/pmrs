import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, unwrap } from "../../lib/api";
import { Table } from "../../components/ui/Table";
import type { Team, Review } from "../../types";

interface SummaryRow { _id: string; studentId: string; average: number }

export function AssistantMarks() {
  const [teamId, setTeamId] = useState("");
  const [reviewId, setReviewId] = useState("");
  const { data: teams } = useQuery({ queryKey: ["teams"], queryFn: () => unwrap(api.get<{ data: Team[] }>("/teams")) });
  const { data: reviews } = useQuery({ queryKey: ["reviews", teamId], queryFn: () => unwrap(api.get<{ data: Review[] }>(`/reviews?teamId=${teamId}`)), enabled: Boolean(teamId) });
  const { data } = useQuery({
    queryKey: ["marks", teamId, reviewId],
    queryFn: () => unwrap(api.get(`/marks?teamId=${teamId}&reviewId=${reviewId}`)),
    enabled: Boolean(teamId && reviewId),
  });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">Marks (read-only)</h1>
      <div className="mb-4 flex gap-3">
        <select value={teamId} onChange={(e) => { setTeamId(e.target.value); setReviewId(""); }} className="rounded border border-ink/20 px-3 py-2 text-sm">
          <option value="">Select a team…</option>
          {(teams ?? []).map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
        </select>
        <select value={reviewId} onChange={(e) => setReviewId(e.target.value)} className="rounded border border-ink/20 px-3 py-2 text-sm" disabled={!teamId}>
          <option value="">Select a review…</option>
          {(reviews ?? []).filter((r) => r.hasMarks).map((r) => <option key={r._id} value={r._id}>{r.type}</option>)}
        </select>
      </div>
      {data && (
        <Table<SummaryRow>
          rows={(data.summaries ?? []).map((s: any) => ({ ...s, _id: s._id }))}
          columns={[
            { header: "Average %", render: (r) => r.average, mono: true },
          ]}
        />
      )}
    </div>
  );
}
