import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api, unwrap } from "../../lib/api";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Card } from "../ui/Card";
import { useToastStore } from "../../store/toastStore";

interface Slot { startTime: string; endTime: string }

/** Shared by Guide and Panel roles - both submit availability that feeds the auto-scheduler (Section 6.14). */
export function AvailabilityForm() {
  const push = useToastStore((s) => s.push);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [slots, setSlots] = useState<Slot[]>([{ startTime: "", endTime: "" }]);

  const { data: mine } = useQuery({ queryKey: ["availability", "mine"], queryFn: () => unwrap(api.get("/availability/mine")) });

  const submit = useMutation({
    mutationFn: () => api.post("/availability", { reviewPeriodStart: periodStart, reviewPeriodEnd: periodEnd, availableSlots: slots.filter((s) => s.startTime && s.endTime) }),
    onSuccess: () => push("Availability submitted"),
  });

  return (
    <Card className="max-w-lg">
      <div className="mb-4 grid grid-cols-2 gap-3">
        <Input label="Review period start" type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} required />
        <Input label="Review period end" type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} required />
      </div>

      <p className="mb-2 text-sm font-medium">Available time slots</p>
      {slots.map((s, i) => (
        <div key={i} className="mb-2 grid grid-cols-2 gap-2">
          <Input type="datetime-local" value={s.startTime} onChange={(e) => setSlots((prev) => prev.map((p, j) => (j === i ? { ...p, startTime: e.target.value } : p)))} />
          <Input type="datetime-local" value={s.endTime} onChange={(e) => setSlots((prev) => prev.map((p, j) => (j === i ? { ...p, endTime: e.target.value } : p)))} />
        </div>
      ))}
      <Button variant="secondary" className="mb-4" onClick={() => setSlots((prev) => [...prev, { startTime: "", endTime: "" }])}>+ Add another slot</Button>

      <Button onClick={() => submit.mutate()}>Submit availability</Button>
      <p className="mt-3 text-xs text-ink/50">{mine?.length ?? 0} availability window(s) currently on file.</p>
    </Card>
  );
}
