import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import { useToastStore } from "../../store/toastStore";

interface ConfigShape {
  ugMaxTeamSize: number; pgMaxTeamSize: number; ugGuideCap: number; pgGuideCap: number;
  teamFormationOpen: boolean;
  guideSelectionStartDate?: string; guideSelectionEndDate?: string;
  reviewPeriodStartDate?: string; reviewPeriodEndDate?: string;
}

/** Global config (Section 6.18): team size caps, guide caps, and the guide-selection / review-period windows. */
export function AdminConfig() {
  const queryClient = useQueryClient();
  const push = useToastStore((s) => s.push);
  const { data } = useQuery({ queryKey: ["config"], queryFn: () => unwrap(api.get<{ data: ConfigShape }>("/config")) });
  const [form, setForm] = useState<ConfigShape | null>(null);

  useEffect(() => { if (data && !form) setForm(data); }, [data, form]);

  const save = useMutation({
    mutationFn: () => api.patch("/config", form),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["config"] }); push("Configuration saved"); },
  });

  if (!form) return null;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 font-display text-2xl">Global Configuration</h1>
      <Card>
        <div className="grid grid-cols-2 gap-4">
          <Input label="UG max team size" type="number" min={1} value={form.ugMaxTeamSize} onChange={(e) => setForm({ ...form, ugMaxTeamSize: Number(e.target.value) })} />
          <Input label="PG max team size" type="number" min={1} value={form.pgMaxTeamSize} onChange={(e) => setForm({ ...form, pgMaxTeamSize: Number(e.target.value) })} />
          <Input label="UG guide cap" type="number" min={0} value={form.ugGuideCap} onChange={(e) => setForm({ ...form, ugGuideCap: Number(e.target.value) })} />
          <Input label="PG guide cap" type="number" min={0} value={form.pgGuideCap} onChange={(e) => setForm({ ...form, pgGuideCap: Number(e.target.value) })} />
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.teamFormationOpen} onChange={(e) => setForm({ ...form, teamFormationOpen: e.target.checked })} />
          Team formation is currently open
        </label>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <Input label="Guide selection start" type="date" value={form.guideSelectionStartDate?.slice(0, 10) ?? ""} onChange={(e) => setForm({ ...form, guideSelectionStartDate: e.target.value })} />
          <Input label="Guide selection end" type="date" value={form.guideSelectionEndDate?.slice(0, 10) ?? ""} onChange={(e) => setForm({ ...form, guideSelectionEndDate: e.target.value })} />
          <Input label="Review period start" type="date" value={form.reviewPeriodStartDate?.slice(0, 10) ?? ""} onChange={(e) => setForm({ ...form, reviewPeriodStartDate: e.target.value })} />
          <Input label="Review period end" type="date" value={form.reviewPeriodEndDate?.slice(0, 10) ?? ""} onChange={(e) => setForm({ ...form, reviewPeriodEndDate: e.target.value })} />
        </div>

        <Button className="mt-6" onClick={() => save.mutate()}>Save configuration</Button>
      </Card>
    </div>
  );
}
