import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, unwrap } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import type { Team } from "../../types";

export function PanelDashboard() {
  const { data: teams } = useQuery({ queryKey: ["teams", "mine"], queryFn: () => unwrap(api.get<{ data: Team[] }>("/teams")) });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">Panel Dashboard</h1>
      <Card className="mb-6 w-fit">
        <p className="font-mono text-2xl text-seal">{teams?.length ?? "—"}</p>
        <p className="text-sm text-ink/60">Assigned teams</p>
      </Card>
      <Link to="/panel/marks" className="text-seal hover:underline">Enter marks →</Link>
    </div>
  );
}
