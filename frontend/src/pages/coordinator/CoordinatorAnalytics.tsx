import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { api, unwrap } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { useAuth } from "../../hooks/useAuth";

export function CoordinatorAnalytics() {
  const { program } = useAuth();
  const { data: overview } = useQuery({ queryKey: ["analytics", "overview", program], queryFn: () => unwrap(api.get(`/analytics/overview?program=${program}`)), enabled: Boolean(program) });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">Program Analytics</h1>
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3">
        <Card><p className="font-mono text-2xl text-seal">{overview?.teamCount ?? "—"}</p><p className="text-sm text-ink/60">Teams</p></Card>
        <Card><p className="font-mono text-2xl text-seal">{overview?.activeCount ?? "—"}</p><p className="text-sm text-ink/60">Active</p></Card>
        <Card><p className="font-mono text-2xl text-seal">{overview?.attendanceRate != null ? `${overview.attendanceRate}%` : "—"}</p><p className="text-sm text-ink/60">Attendance rate</p></Card>
      </div>
      <Card>
        <h2 className="mb-4 font-display text-lg">Average marks by stage</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={overview?.marksByStage ?? []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1B243015" />
            <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
            <Tooltip />
            <Bar dataKey="avgScore" fill="#1F5C57" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
