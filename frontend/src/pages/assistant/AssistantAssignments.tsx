import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, unwrap } from "../../lib/api";
import { Table } from "../../components/ui/Table";
import type { Team } from "../../types";

/** Assistant role (Section 6.19): view and download only - no write actions anywhere. */
export function AssistantAssignments() {
  const [program, setProgram] = useState("");
  const { data: programs } = useQuery({ queryKey: ["programs"], queryFn: () => unwrap(api.get("/programs")) });
  const { data } = useQuery({
    queryKey: ["assignments", program],
    queryFn: () => unwrap(api.get<{ data: Team[] }>(`/assignments${program ? `?program=${program}` : ""}`)),
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl">Assignments (read-only)</h1>
        <select value={program} onChange={(e) => setProgram(e.target.value)} className="rounded border border-ink/20 px-3 py-2 text-sm">
          <option value="">All programs</option>
          {(programs ?? []).map((p: { _id: string; name: string }) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
      </div>
      <Table<Team>
        rows={data ?? []}
        columns={[
          { header: "Team", render: (r) => r.name },
          { header: "Students", render: (r) => r.students.map((s) => s.name).join(", ") },
          { header: "Guide", render: (r) => (typeof r.guideId === "object" ? r.guideId?.name : "—") ?? "—" },
          { header: "Status", render: (r) => r.status },
        ]}
      />
    </div>
  );
}
