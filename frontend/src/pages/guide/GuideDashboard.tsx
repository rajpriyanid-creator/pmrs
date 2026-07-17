import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, unwrap } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import type { Team } from "../../types";

export function GuideDashboard() {
  const { data: teams } = useQuery({ queryKey: ["teams", "mine"], queryFn: () => unwrap(api.get<{ data: Team[] }>("/teams")) });
  const { data: limits } = useQuery({ queryKey: ["guide-limits"], queryFn: () => unwrap(api.get("/guide-requests/limits")) });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">Guide Dashboard</h1>
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card><p className="font-mono text-2xl text-seal">{teams?.length ?? "—"}</p><p className="text-sm text-ink/60">Teams guided</p></Card>
        <Card><p className="font-mono text-2xl text-seal">{limits?.ug.remaining ?? "—"}</p><p className="text-sm text-ink/60">UG slots left ({limits?.ug.cap})</p></Card>
        <Card><p className="font-mono text-2xl text-seal">{limits?.pg.remaining ?? "—"}</p><p className="text-sm text-ink/60">PG slots left ({limits?.pg.cap})</p></Card>
      </div>
      <Link to="/guide/requests" className="text-seal hover:underline">Review pending guide requests →</Link>
    </div>
  );
}
