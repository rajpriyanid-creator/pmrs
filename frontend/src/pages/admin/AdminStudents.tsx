import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "../../lib/api";
import { Table } from "../../components/ui/Table";
import { useToastStore } from "../../store/toastStore";

interface StudentRow { _id: string; name: string; rollNo: string; email: string; program: string }

export function AdminStudents() {
  const queryClient = useQueryClient();
  const push = useToastStore((s) => s.push);
  const [program, setProgram] = useState("");

  const { data: programs } = useQuery({ queryKey: ["programs"], queryFn: () => unwrap(api.get("/programs")) });
  const { data } = useQuery({
    queryKey: ["students", program],
    queryFn: () => unwrap(api.get<{ data: StudentRow[] }>(`/students?limit=100${program ? `&program=${program}` : ""}`)),
  });

  const importFile = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      return api.post("/students/import", fd, { headers: { "Content-Type": "multipart/form-data" } });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["students"] }); push("Students imported"); },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl">Students</h1>
        <div className="flex items-center gap-2">
          <select value={program} onChange={(e) => setProgram(e.target.value)} className="rounded border border-ink/20 px-3 py-2 text-sm">
            <option value="">All programs</option>
            {(programs ?? []).map((p: { _id: string; name: string }) => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
          <label className="cursor-pointer">
            <input type="file" accept=".csv,.xlsx" hidden onChange={(e) => e.target.files?.[0] && importFile.mutate(e.target.files[0])} />
            <span className="inline-flex items-center rounded border border-ink/20 px-4 py-2 text-sm hover:bg-ink/5">Import CSV/Excel</span>
          </label>
        </div>
      </div>

      <Table<StudentRow>
        rows={data ?? []}
        columns={[
          { header: "Roll No", render: (r) => r.rollNo, mono: true },
          { header: "Name", render: (r) => r.name },
          { header: "Email", render: (r) => r.email },
        ]}
      />
    </div>
  );
}
