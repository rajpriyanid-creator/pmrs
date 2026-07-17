import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { api, unwrap } from "../../lib/api";
import { Card } from "../../components/ui/Card";

interface WorkloadRow { name: string; teamCount: number; ugCap: number; pgCap: number }
interface MarksByStage { stage: string; avgScore: number }

/** Analytics dashboard (Section 11 bonus feature). */
export function AdminAnalytics() {
  const { data: overview } = useQuery({ queryKey: ["analytics", "overview"], queryFn: () => unwrap(api.get("/analytics/overview")) });
  const { data: workload } = useQuery({ queryKey: ["analytics", "workload"], queryFn: () => unwrap(api.get<{ data: WorkloadRow[] }>("/analytics/guide-workload")) });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">Analytics</h1>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Teams", value: overview?.teamCount },
          { label: "Active", value: overview?.activeCount },
          { label: "Forming", value: overview?.formingCount },
          { label: "Attendance rate", value: overview?.attendanceRate != null ? `${overview.attendanceRate}%` : "—" },
        ].map((s) => (
          <Card key={s.label}><p className="font-mono text-2xl text-seal">{s.value ?? "—"}</p><p className="text-sm text-ink/60">{s.label}</p></Card>
        ))}
      </div>

      <Card className="mb-8">
        <h2 className="mb-4 font-display text-lg">Average marks by review stage</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={overview?.marksByStage as MarksByStage[] ?? []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1B243015" />
            <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
            <Tooltip />
            <Bar dataKey="avgScore" fill="#B8863B" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <h2 className="mb-4 font-display text-lg">Guide workload distribution</h2>
        <ResponsiveContainer width="100%" height={Math.max(200, (workload?.length ?? 0) * 36)}>
          <BarChart data={workload ?? []} layout="vertical" margin={{ left: 80 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1B243015" />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
            <Tooltip />
            <Bar dataKey="teamCount" fill="#1F5C57" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
