import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, unwrap } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { useAuth } from "../../hooks/useAuth";
import type { Team } from "../../types";

export function CoordinatorDashboard() {
  const { program } = useAuth();
  const { data: teams } = useQuery({
    queryKey: ["teams", program],
    queryFn: () => unwrap(api.get<{ data: Team[] }>(`/teams?program=${program}`)),
    enabled: Boolean(program),
  });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">Coordinator Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card><p className="font-mono text-3xl text-seal">{teams?.length ?? "—"}</p><p className="text-sm text-ink/60">Teams</p></Card>
      </div>
      <div className="mt-8 flex gap-3">
        <Link to="/coordinator/reviews" className="text-seal hover:underline">Schedule reviews →</Link>
        <Link to="/coordinator/viva-panel" className="text-seal hover:underline">Manage Viva Panel →</Link>
      </div>
    </div>
  );
}
