import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api, unwrap } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import { LiveEditModal } from "../../components/shared/LiveEditModal";
import { useAuth } from "../../hooks/useAuth";
import { useToastStore } from "../../store/toastStore";
import type { Team } from "../../types";

interface TemplateRow { _id: string; name: string; type: string; placeholderMap: { field: string; label: string; required: boolean }[] }

/** Document & letter generation (Section 6.13): pick a template, fill detected fields, generate + download. */
export function CoordinatorDocuments() {
  const { program } = useAuth();
  const push = useToastStore((s) => s.push);
  const [templateId, setTemplateId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [generatedDocId, setGeneratedDocId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const { data: templates } = useQuery({ queryKey: ["templates"], queryFn: () => unwrap(api.get<{ data: TemplateRow[] }>("/documents/templates")) });
  const { data: teams } = useQuery({ queryKey: ["teams", program], queryFn: () => unwrap(api.get<{ data: Team[] }>(`/teams?program=${program}`)), enabled: Boolean(program) });
  const template = templates?.find((t) => t._id === templateId);

  const generate = useMutation({
    mutationFn: () => api.post("/documents/generate", { templateId, teamId, data: values }),
    onSuccess: (res) => { setDownloadUrl(res.data.data.downloadUrl); setGeneratedDocId(res.data.data.id); push("Document generated"); },
    onError: () => push("Could not generate document - check required fields", "error"),
  });

  return (
    <div className="max-w-xl">
      <h1 className="mb-6 font-display text-2xl">Documents & Letters</h1>
      <Card>
        <div className="mb-4 flex flex-col gap-3">
          <select value={templateId} onChange={(e) => { setTemplateId(e.target.value); setValues({}); setDownloadUrl(null); }} className="rounded border border-ink/20 px-3 py-2 text-sm">
            <option value="">Select a template…</option>
            {(templates ?? []).map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
          <select value={teamId} onChange={(e) => setTeamId(e.target.value)} className="rounded border border-ink/20 px-3 py-2 text-sm">
            <option value="">(optional) Link to team…</option>
            {(teams ?? []).map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
        </div>

        {template && (
          <form onSubmit={(e) => { e.preventDefault(); generate.mutate(); }} className="flex flex-col gap-3">
            {template.placeholderMap.map((p) => (
              <Input key={p.field} label={p.label} required={p.required} value={values[p.field] ?? ""} onChange={(e) => setValues({ ...values, [p.field]: e.target.value })} />
            ))}
            <Button type="submit">Generate document</Button>
          </form>
        )}

        {downloadUrl && (
          <div className="mt-4 flex items-center gap-4">
            <a href={downloadUrl} className="text-sm text-seal hover:underline">Download generated document →</a>
            <button onClick={() => setEditOpen(true)} className="text-sm text-verdant hover:underline">Edit in browser →</button>
          </div>
        )}
      </Card>

      <LiveEditModal documentId={generatedDocId} open={editOpen} onClose={() => setEditOpen(false)} />
    </div>
  );
}
