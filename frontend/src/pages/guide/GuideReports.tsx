import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { useToastStore } from "../../store/toastStore";
import type { Team } from "../../types";

interface ReportRow { _id: string; fileName: string; status: "uploaded" | "approved"; teamId: string }

/** Guide's final-report approval step (Section 6.16), after the student has uploaded it. */
export function GuideReports() {
  const queryClient = useQueryClient();
  const push = useToastStore((s) => s.push);
  const [teamId, setTeamId] = useState("");

  const { data: teams } = useQuery({ queryKey: ["teams", "mine"], queryFn: () => unwrap(api.get<{ data: Team[] }>("/teams")) });
  const { data: report } = useQuery({
    queryKey: ["report", teamId],
    queryFn: () => unwrap(api.get<{ data: ReportRow }>(`/reports/${teamId}`)).catch(() => null),
    enabled: Boolean(teamId),
  });

  const approve = useMutation({
    mutationFn: () => api.patch(`/reports/${teamId}/approve`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["report", teamId] }); push("Final report approved"); },
  });

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 font-display text-2xl">Final Reports</h1>
      <select value={teamId} onChange={(e) => setTeamId(e.target.value)} className="mb-4 rounded border border-ink/20 px-3 py-2 text-sm">
        <option value="">Select a team…</option>
        {(teams ?? []).map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
      </select>

      {teamId && (
        <Card>
          {report ? (
            <div>
              <p className="font-medium">{report.fileName}</p>
              <p className="mb-4 text-sm text-ink/60">Status: {report.status}</p>
              {report.status === "uploaded" && <Button onClick={() => approve.mutate()}>Approve report</Button>}
            </div>
          ) : (
            <p className="text-sm text-ink/50">No report uploaded yet for this team.</p>
          )}
        </Card>
      )}
    </div>
  );
}
