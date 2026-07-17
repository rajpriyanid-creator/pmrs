import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "../../lib/api";
import { Table } from "../../components/ui/Table";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { useToastStore } from "../../store/toastStore";

interface FacultyRow { _id: string; name: string; username: string; email: string; designation: string; seniority: number; guideLimits: { ug: number; pg: number } }

export function AdminFaculty() {
  const queryClient = useQueryClient();
  const push = useToastStore((s) => s.push);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", username: "", email: "", designation: "", seniority: 1 });

  const { data } = useQuery({
    queryKey: ["faculty"],
    queryFn: () => unwrap(api.get<{ data: FacultyRow[] }>("/faculty?limit=100")),
  });

  const create = useMutation({
    mutationFn: () => api.post("/faculty", form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faculty"] });
      push("Faculty account created");
      setModalOpen(false);
    },
  });

  const importFile = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      return api.post("/faculty/import", fd, { headers: { "Content-Type": "multipart/form-data" } });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["faculty"] }); push("Faculty imported"); },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl">Faculty</h1>
        <div className="flex gap-2">
          <label className="cursor-pointer">
            <input type="file" accept=".csv,.xlsx" hidden onChange={(e) => e.target.files?.[0] && importFile.mutate(e.target.files[0])} />
            <span className="inline-flex items-center rounded border border-ink/20 px-4 py-2 text-sm hover:bg-ink/5">Import CSV/Excel</span>
          </label>
          <a href="/api/faculty/export" className="inline-flex items-center rounded border border-ink/20 px-4 py-2 text-sm hover:bg-ink/5">Export</a>
          <Button onClick={() => setModalOpen(true)}>Add Faculty</Button>
        </div>
      </div>

      <Table<FacultyRow>
        rows={data ?? []}
        columns={[
          { header: "Seniority", render: (r) => r.seniority, mono: true },
          { header: "Name", render: (r) => r.name },
          { header: "Username", render: (r) => r.username, mono: true },
          { header: "Email", render: (r) => r.email },
          { header: "UG cap", render: (r) => r.guideLimits.ug, mono: true },
          { header: "PG cap", render: (r) => r.guideLimits.pg, mono: true },
        ]}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Faculty">
        <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="flex flex-col gap-3">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input label="Designation" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
          <Input label="Seniority (numeric)" type="number" min={1} value={form.seniority} onChange={(e) => setForm({ ...form, seniority: Number(e.target.value) })} required />
          <Button type="submit">Create</Button>
        </form>
      </Modal>
    </div>
  );
}
