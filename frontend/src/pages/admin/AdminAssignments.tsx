import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { useToastStore } from "../../store/toastStore";
import type { Team } from "../../types";

interface FacultyOption { _id: string; name: string }

/**
 * Admin Assignment Dashboard (Section 6.9): a single batch-save button
 * instead of N per-row saves. Edits accumulate in local state and are
 * committed with one bulk request.
 */
export function AdminAssignments() {
  const queryClient = useQueryClient();
  const push = useToastStore((s) => s.push);
  const [program, setProgram] = useState("");
  const [edits, setEdits] = useState<Record<string, { guideId?: string }>>({});

  const { data: programs } = useQuery({ queryKey: ["programs"], queryFn: () => unwrap(api.get("/programs")) });
  const { data: teams } = useQuery({
    queryKey: ["assignments", program],
    queryFn: () => unwrap(api.get<{ data: Team[] }>(`/assignments${program ? `?program=${program}` : ""}`)),
    enabled: Boolean(program),
  });
  const { data: faculty } = useQuery({ queryKey: ["faculty"], queryFn: () => unwrap(api.get<{ data: FacultyOption[] }>("/faculty?limit=200")) });

  const dirtyCount = Object.keys(edits).length;

  const save = useMutation({
    mutationFn: () => api.post("/assignments/batch", {
      program,
      updates: Object.entries(edits).map(([teamId, e]) => ({ teamId, guideId: e.guideId })),
    }),
    onSuccess: () => {
      push(`Saved ${dirtyCount} assignment${dirtyCount === 1 ? "" : "s"}`);
      setEdits({});
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
  });

  const autoAssign = useMutation({
    mutationFn: () => api.post("/assignments/auto-assign", { program }),
    onSuccess: (res) => {
      push(`Auto-assigned ${res.data.data.assignedCount} team(s)`);
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
  });

  const rows = useMemo(() => teams ?? [], [teams]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl">Assignment Dashboard</h1>
        <div className="flex items-center gap-2">
          <select value={program} onChange={(e) => setProgram(e.target.value)} className="rounded border border-ink/20 px-3 py-2 text-sm">
            <option value="">Select a program…</option>
            {(programs ?? []).map((p: { _id: string; name: string }) => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
          <Button variant="secondary" disabled={!program} onClick={() => autoAssign.mutate()}>Auto-assign guides</Button>
          <Button disabled={dirtyCount === 0} onClick={() => save.mutate()}>
            Save all{dirtyCount > 0 ? ` (${dirtyCount})` : ""}
          </Button>
        </div>
      </div>

      {!program ? (
        <p className="text-sm text-ink/50">Select a program to view its teams.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="ledger-row text-xs uppercase tracking-wide text-ink/50">
              <th className="px-3 py-2">Team</th>
              <th className="px-3 py-2">Students</th>
              <th className="px-3 py-2">Guide</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((team) => {
              const currentGuide = typeof team.guideId === "object" ? team.guideId?._id : team.guideId;
              const value = edits[team._id]?.guideId ?? currentGuide ?? "";
              return (
                <tr key={team._id} className="ledger-row">
                  <td className="px-3 py-3 font-medium">{team.name}</td>
                  <td className="px-3 py-3 text-ink/60">{team.students.map((s) => s.name).join(", ")}</td>
                  <td className="px-3 py-3">
                    <select
                      value={value}
                      onChange={(e) => setEdits((prev) => ({ ...prev, [team._id]: { guideId: e.target.value } }))}
                      className="rounded border border-ink/20 px-2 py-1"
                    >
                      <option value="">— unassigned —</option>
                      {(faculty ?? []).map((f) => <option key={f._id} value={f._id}>{f.name}</option>)}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
