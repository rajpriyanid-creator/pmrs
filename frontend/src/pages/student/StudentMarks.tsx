import { useQuery } from "@tanstack/react-query";
import { api, unwrap } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import type { Team } from "../../types";

interface OverallResponse { summaries: { reviewId: { type: string }; average: number }[]; overall: number | null }

export function StudentMarks() {
  const { data: teams } = useQuery({ queryKey: ["teams", "mine"], queryFn: () => unwrap(api.get<{ data: Team[] }>("/teams")) });
  const myTeam = teams?.[0];
  // In production this would resolve the logged-in student's own _id from
  // the token via a /auth/me endpoint; shown here against the first team
  // member as a placeholder for that wiring.
  const studentId = myTeam?.students?.[0]?._id;

  const { data } = useQuery({
    queryKey: ["marks", "overall", myTeam?._id, studentId],
    queryFn: () => unwrap(api.get<{ data: OverallResponse }>(`/marks/${myTeam?._id}/${studentId}/overall`)),
    enabled: Boolean(myTeam && studentId),
  });

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 font-display text-2xl">My Marks</h1>
      <Card className="mb-4">
        <p className="font-mono text-3xl text-seal">{data?.overall ?? "—"}%</p>
        <p className="text-sm text-ink/60">Overall average across completed reviews</p>
      </Card>
      <div className="flex flex-col gap-2">
        {(data?.summaries ?? []).map((s, i) => (
          <div key={i} className="ledger-row flex items-center justify-between text-sm">
            <span className="capitalize">{s.reviewId.type}</span>
            <span className="font-mono">{s.average}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
