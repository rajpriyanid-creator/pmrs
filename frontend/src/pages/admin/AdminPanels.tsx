import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { useToastStore } from "../../store/toastStore";

interface FacultyOption { _id: string; name: string }
interface ReviewPanelRow {
  _id: string;
  coordinatorId: { _id: string; name: string };
  memberIds: { _id: string; name: string }[];
  teamIds: { _id: string; name: string }[];
}

/** Admin-side Review Panel formation (Section 6.8) - up to 4 members, separate from the Coordinator's Viva Panel. */
export function AdminPanels() {
  const queryClient = useQueryClient();
  const push = useToastStore((s) => s.push);
  const [program, setProgram] = useState("");
  const [coordinatorId, setCoordinatorId] = useState("");
  const [memberIds, setMemberIds] = useState<string[]>([]);

  const { data: programs } = useQuery({ queryKey: ["programs"], queryFn: () => unwrap(api.get("/programs")) });
  const { data: faculty } = useQuery({ queryKey: ["faculty"], queryFn: () => unwrap(api.get<{ data: FacultyOption[] }>("/faculty?limit=200")) });
  const { data: panels } = useQuery({
    queryKey: ["review-panels", program],
    queryFn: () => unwrap(api.get<{ data: ReviewPanelRow[] }>(`/panels/review-panels${program ? `?program=${program}` : ""}`)),
    enabled: Boolean(program),
  });

  const upsert = useMutation({
    mutationFn: () => api.post("/panels/review-panels", { program, coordinatorId, memberIds, teamIds: [] }),
    onSuccess: () => {
      push("Review panel saved");
      queryClient.invalidateQueries({ queryKey: ["review-panels"] });
      setCoordinatorId(""); setMemberIds([]);
    },
  });

  function toggleMember(id: string) {
    setMemberIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 4 ? [...prev, id] : prev));
  }

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">Review Panels</h1>

      <select value={program} onChange={(e) => setProgram(e.target.value)} className="mb-6 rounded border border-ink/20 px-3 py-2 text-sm">
        <option value="">Select a program…</option>
        {(programs ?? []).map((p: { _id: string; name: string }) => <option key={p._id} value={p._id}>{p.name}</option>)}
      </select>

      {program && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-ink/10 p-4">
            <h2 className="mb-3 font-display text-lg">Form a panel</h2>
            <label className="mb-1 block text-sm font-medium">Coordinator</label>
            <select value={coordinatorId} onChange={(e) => setCoordinatorId(e.target.value)} className="mb-4 w-full rounded border border-ink/20 px-3 py-2 text-sm">
              <option value="">Select…</option>
              {(faculty ?? []).map((f) => <option key={f._id} value={f._id}>{f.name}</option>)}
            </select>

            <label className="mb-1 block text-sm font-medium">Members (max 4)</label>
            <div className="mb-4 flex max-h-48 flex-col gap-1 overflow-y-auto rounded border border-ink/10 p-2">
              {(faculty ?? []).map((f) => (
                <label key={f._id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={memberIds.includes(f._id)} onChange={() => toggleMember(f._id)} />
                  {f.name}
                </label>
              ))}
            </div>
            <Button disabled={!coordinatorId} onClick={() => upsert.mutate()}>Save panel</Button>
          </div>

          <div>
            <h2 className="mb-3 font-display text-lg">Existing panels</h2>
            <div className="flex flex-col gap-3">
              {(panels ?? []).map((p) => (
                <div key={p._id} className="rounded border border-ink/10 p-3 text-sm">
                  <p className="font-medium">{p.coordinatorId?.name}</p>
                  <p className="text-ink/60">{p.memberIds.map((m) => m.name).join(", ") || "No members yet"}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
