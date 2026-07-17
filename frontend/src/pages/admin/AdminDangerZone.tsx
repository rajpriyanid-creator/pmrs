import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useToastStore } from "../../store/toastStore";

/**
 * Bulk destructive admin operations (Section 6.18): each requires typing
 * "DELETE" to confirm - no single-click destructive action anywhere here.
 */
export function AdminDangerZone() {
  const push = useToastStore((s) => s.push);
  const [target, setTarget] = useState<null | { label: string; description: string; run: () => Promise<unknown> }>(null);

  const actions = [
    { label: "Delete all solo teams", description: "Removes every team with exactly one student. This cannot be undone.", run: () => api.delete("/teams/solo") },
    { label: "Delete all teams", description: "Removes every team across every program. This cannot be undone.", run: () => api.delete("/teams") },
    { label: "Delete all students", description: "Removes every student record. This cannot be undone.", run: () => api.delete("/students") },
    { label: "Delete all faculty", description: "Removes every faculty record. This cannot be undone.", run: () => api.delete("/faculty") },
  ];

  const mutation = useMutation({
    mutationFn: (run: () => Promise<unknown>) => run(),
    onSuccess: () => push("Operation completed", "info"),
  });

  return (
    <div className="max-w-2xl">
      <h1 className="mb-2 font-display text-2xl text-flag">Danger Zone</h1>
      <p className="mb-6 text-sm text-ink/60">These bulk operations are irreversible. Each requires typed confirmation.</p>
      <div className="flex flex-col gap-3">
        {actions.map((a) => (
          <Card key={a.label} className="flex items-center justify-between border-flag/30">
            <div>
              <p className="font-medium">{a.label}</p>
              <p className="text-sm text-ink/60">{a.description}</p>
            </div>
            <Button variant="danger" onClick={() => setTarget(a)}>Delete</Button>
          </Card>
        ))}
      </div>

      {target && (
        <ConfirmDialog
          open={Boolean(target)}
          onClose={() => setTarget(null)}
          onConfirm={() => mutation.mutate(target.run)}
          title={target.label}
          description={target.description}
        />
      )}
    </div>
  );
}
