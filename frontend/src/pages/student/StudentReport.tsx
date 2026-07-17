import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { useToastStore } from "../../store/toastStore";
import type { Team } from "../../types";

interface ReportRow { fileName: string; status: string }

/** Final report upload (Section 6.16) - student side. */
export function StudentReport() {
  const queryClient = useQueryClient();
  const push = useToastStore((s) => s.push);
  const [file, setFile] = useState<File | null>(null);

  const { data: teams } = useQuery({ queryKey: ["teams", "mine"], queryFn: () => unwrap(api.get<{ data: Team[] }>("/teams")) });
  const myTeam = teams?.[0];
  const { data: report } = useQuery({
    queryKey: ["report", myTeam?._id],
    queryFn: () => unwrap(api.get<{ data: ReportRow }>(`/reports/${myTeam?._id}`)).catch(() => null),
    enabled: Boolean(myTeam),
  });

  const upload = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append("report", file!);
      fd.append("teamId", myTeam!._id);
      return api.post("/reports", fd, { headers: { "Content-Type": "multipart/form-data" } });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["report"] }); push("Final report uploaded"); },
  });

  return (
    <div className="max-w-md">
      <h1 className="mb-6 font-display text-2xl">Final Report</h1>
      <Card>
        {report && <p className="mb-3 text-sm">Current: <strong>{report.fileName}</strong> · {report.status}</p>}
        <input type="file" accept=".pdf,.docx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mb-3 text-sm" />
        <Button disabled={!file} onClick={() => upload.mutate()}>Upload report</Button>
      </Card>
    </div>
  );
}
