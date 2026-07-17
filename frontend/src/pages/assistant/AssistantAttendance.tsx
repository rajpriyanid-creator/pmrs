import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, unwrap } from "../../lib/api";
import { Table } from "../../components/ui/Table";
import type { Team } from "../../types";

interface AttendanceRow { _id: string; teamId: string; kind: string; perStudent: { studentId: { name: string }; present: boolean }[] }

export function AssistantAttendance() {
  const [teamId, setTeamId] = useState("");
  const { data: teams } = useQuery({ queryKey: ["teams"], queryFn: () => unwrap(api.get<{ data: Team[] }>("/teams")) });
  const { data } = useQuery({
    queryKey: ["attendance", teamId],
    queryFn: () => unwrap(api.get<{ data: AttendanceRow[] }>(`/attendance${teamId ? `?teamId=${teamId}` : ""}`)),
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl">Attendance (read-only)</h1>
        <select value={teamId} onChange={(e) => setTeamId(e.target.value)} className="rounded border border-ink/20 px-3 py-2 text-sm">
          <option value="">All teams</option>
          {(teams ?? []).map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
        </select>
      </div>
      <Table<AttendanceRow>
        rows={data ?? []}
        columns={[
          { header: "Kind", render: (r) => r.kind },
          { header: "Present", render: (r) => r.perStudent.filter((p) => p.present).map((p) => p.studentId.name).join(", ") || "—" },
          { header: "Absent", render: (r) => r.perStudent.filter((p) => !p.present).map((p) => p.studentId.name).join(", ") || "—" },
        ]}
      />
    </div>
  );
}
