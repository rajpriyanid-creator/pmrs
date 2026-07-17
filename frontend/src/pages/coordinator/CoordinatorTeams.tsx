import { useQuery } from "@tanstack/react-query";
import { api, unwrap } from "../../lib/api";
import { Table } from "../../components/ui/Table";
import { Badge } from "../../components/ui/Badge";
import { useAuth } from "../../hooks/useAuth";
import type { Team } from "../../types";

export function CoordinatorTeams() {
  const { program } = useAuth();
  const { data } = useQuery({
    queryKey: ["teams", program],
    queryFn: () => unwrap(api.get<{ data: Team[] }>(`/teams?program=${program}`)),
    enabled: Boolean(program),
  });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">Teams</h1>
      <Table<Team>
        rows={data ?? []}
        columns={[
          { header: "Team", render: (r) => r.name },
          { header: "Students", render: (r) => r.students.map((s) => s.name).join(", ") },
          { header: "Guide", render: (r) => (typeof r.guideId === "object" ? r.guideId?.name : "—") ?? "—" },
          { header: "Status", render: (r) => <Badge tone={r.status === "active" ? "verdant" : r.status === "locked" ? "seal" : "neutral"}>{r.status}</Badge> },
        ]}
      />
    </div>
  );
}
