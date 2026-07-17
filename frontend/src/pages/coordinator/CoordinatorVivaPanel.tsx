import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import { useToastStore } from "../../store/toastStore";

interface VivaPanelShape {
  _id: string;
  internalMembers: { _id: string; name: string }[];
  externalMembers: { name: string; affiliation: string; email: string }[];
  teamIds: { _id: string; name: string }[];
}

/**
 * Viva Panel (Section 6.8): lives only in the Coordinator login, prefilled
 * with that coordinator's Review Panel members (locked - cannot be
 * changed here), plus freely editable external members.
 */
export function CoordinatorVivaPanel() {
  const queryClient = useQueryClient();
  const push = useToastStore((s) => s.push);
  const [ext, setExt] = useState({ name: "", affiliation: "", email: "" });

  const { data: panel } = useQuery({ queryKey: ["viva-panel"], queryFn: () => unwrap(api.get<{ data: VivaPanelShape }>("/panels/viva-panel/mine")) });

  const addExternal = useMutation({
    mutationFn: () => api.patch("/panels/viva-panel/mine", { addExternal: [ext], removeExternalEmails: [] }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["viva-panel"] }); push("External member added"); setExt({ name: "", affiliation: "", email: "" }); },
  });

  const removeExternal = useMutation({
    mutationFn: (email: string) => api.patch("/panels/viva-panel/mine", { addExternal: [], removeExternalEmails: [email] }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["viva-panel"] }); push("External member removed"); },
  });

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 font-display text-2xl">Viva Panel</h1>

      <Card className="mb-6">
        <h2 className="mb-2 font-display text-lg">Internal members</h2>
        <p className="mb-3 text-xs text-ink/50">Prefilled from your Review Panel - locked here.</p>
        <div className="flex flex-wrap gap-2">
          {(panel?.internalMembers ?? []).map((m) => (
            <span key={m._id} className="rounded-full bg-ink/5 px-3 py-1 text-sm">{m.name}</span>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 font-display text-lg">External members</h2>
        <div className="mb-4 flex flex-col gap-2">
          {(panel?.externalMembers ?? []).map((m) => (
            <div key={m.email} className="ledger-row flex items-center justify-between text-sm">
              <span>{m.name} · {m.affiliation} · <span className="text-ink/50">{m.email}</span></span>
              <button onClick={() => removeExternal.mutate(m.email)} className="text-flag hover:underline">Remove</button>
            </div>
          ))}
          {panel?.externalMembers.length === 0 && <p className="text-sm text-ink/50">No external members yet.</p>}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); addExternal.mutate(); }} className="grid grid-cols-3 gap-2">
          <Input placeholder="Name" value={ext.name} onChange={(e) => setExt({ ...ext, name: e.target.value })} required />
          <Input placeholder="Affiliation" value={ext.affiliation} onChange={(e) => setExt({ ...ext, affiliation: e.target.value })} required />
          <Input placeholder="Email" type="email" value={ext.email} onChange={(e) => setExt({ ...ext, email: e.target.value })} required />
          <Button type="submit" className="col-span-3">Add external member</Button>
        </form>
      </Card>
    </div>
  );
}
