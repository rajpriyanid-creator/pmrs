import { useQuery } from "@tanstack/react-query";
import { api, unwrap } from "../../lib/api";
import { Table } from "../../components/ui/Table";
import type { Team } from "../../types";

export function PanelTeams() {
  const { data } = useQuery({ queryKey: ["teams", "mine"], queryFn: () => unwrap(api.get<{ data: Team[] }>("/teams")) });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">Assigned Teams</h1>
      <Table<Team>
        rows={data ?? []}
        columns={[
          { header: "Team", render: (r) => r.name },
          { header: "Students", render: (r) => r.students.map((s) => s.name).join(", ") },
          { header: "Guide", render: (r) => (typeof r.guideId === "object" ? r.guideId?.name : "—") ?? "—" },
        ]}
      />
    </div>
  );
}
