import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import { useToastStore } from "../../store/toastStore";

interface TemplateRow { _id: string; name: string; type: string; placeholderMap: { field: string }[] }

const TYPES = [
  { value: "viva", label: "Viva Notice" },
  { value: "internalExaminer", label: "Internal Examiner Letter" },
  { value: "externalExaminer", label: "External Examiner Letter" },
  { value: "chairmanLetter", label: "Chairman Letter" },
];

/** Document template management (Section 6.13): upload a .docx, placeholders auto-detected. */
export function AdminDocuments() {
  const queryClient = useQueryClient();
  const push = useToastStore((s) => s.push);
  const [name, setName] = useState("");
  const [type, setType] = useState(TYPES[0].value);
  const [file, setFile] = useState<File | null>(null);

  const { data: templates } = useQuery({ queryKey: ["templates"], queryFn: () => unwrap(api.get<{ data: TemplateRow[] }>("/documents/templates")) });

  const upload = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append("template", file!);
      fd.append("name", name);
      fd.append("type", type);
      return api.post("/documents/templates", fd, { headers: { "Content-Type": "multipart/form-data" } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      push("Template uploaded - placeholders detected automatically");
      setName(""); setFile(null);
    },
  });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">Document Templates</h1>
      <Card className="mb-6">
        <h2 className="mb-3 font-display text-lg">Upload a template</h2>
        <form onSubmit={(e) => { e.preventDefault(); upload.mutate(); }} className="flex flex-col gap-3 md:flex-row md:items-end">
          <Input label="Template name" value={name} onChange={(e) => setName(e.target.value)} required className="md:w-56" />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-ink/80">Letter type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="rounded border border-ink/20 px-3 py-2 text-sm">
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <input type="file" accept=".docx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required />
          <Button type="submit" disabled={!file}>Upload</Button>
        </form>
        <p className="mt-2 text-xs text-ink/50">Add <code>{"{fieldName}"}</code> placeholders anywhere in the .docx text - they're detected automatically, no manual mapping required.</p>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {(templates ?? []).map((t) => (
          <Card key={t._id}>
            <p className="font-medium">{t.name}</p>
            <p className="mb-2 text-xs uppercase tracking-wide text-ink/40">{t.type}</p>
            <p className="text-sm text-ink/60">Fields: {t.placeholderMap.map((p) => p.field).join(", ") || "none detected"}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
