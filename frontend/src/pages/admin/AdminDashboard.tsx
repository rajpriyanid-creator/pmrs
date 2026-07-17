import { useQuery } from "@tanstack/react-query";
import { api, unwrap } from "../../lib/api";
import { Card } from "../../components/ui/Card";

export function AdminDashboard() {
  const { data: programs } = useQuery({ queryKey: ["programs"], queryFn: () => unwrap(api.get("/programs")) });
  const { data: overview } = useQuery({ queryKey: ["analytics", "overview"], queryFn: () => unwrap(api.get("/analytics/overview")) });

  const stats = [
    { label: "Teams", value: overview?.teamCount ?? "—" },
    { label: "Active", value: overview?.activeCount ?? "—" },
    { label: "Forming", value: overview?.formingCount ?? "—" },
    { label: "Programs", value: programs?.length ?? "—" },
  ];

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">Admin Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <p className="font-mono text-3xl text-seal">{s.value}</p>
            <p className="text-sm text-ink/60">{s.label}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
