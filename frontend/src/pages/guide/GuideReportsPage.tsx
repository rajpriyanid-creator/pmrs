import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, THead, TH, TR, TD, EmptyState, TableSkeleton } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Card';
import { toast } from '@/components/ui/Toast';
import { apiErrorMessage, api } from '@/api/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Download, FileText } from 'lucide-react';

function useReports() {
  return useQuery({
    queryKey: ['guide-reports'],
    queryFn: async () => {
      const res = await api.get('/reports');
      return res.data.reports as any[];
    },
  });
}

export function GuideReportsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useReports();

  async function handleApprove(id: string) {
    if (!confirm('Approve this report? Students will be notified.')) return;
    try {
      await api.patch(`/reports/${id}/approve`);
      toast.success('Report approved. Students notified.');
      qc.invalidateQueries({ queryKey: ['guide-reports'] });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function handleDownload(id: string, filename: string) {
    try {
      const res = await api.get(`/reports/${id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <AppShell title="Final Reports">
      <PageHeader
        title="Final Reports"
        description="Review and approve submitted final reports from your teams."
      />

      <Card>
        {isLoading ? (
          <TableSkeleton />
        ) : !data || data.length === 0 ? (
          <EmptyState
            title="No reports yet"
            description="Your teams haven't uploaded their final reports yet."
          />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Team</TH>
                <TH>Filename</TH>
                <TH>Uploaded by</TH>
                <TH>Status</TH>
                <TH>Uploaded</TH>
                <TH>Actions</TH>
              </tr>
            </THead>
            <tbody>
              {data.map((r) => (
                <TR key={r._id}>
                  <TD className="font-medium">
                    <span className="flex items-center gap-2">
                      <FileText size={14} className="text-[var(--color-seal)]" />
                      {r.teamId?.name ?? '—'}
                    </span>
                  </TD>
                  <TD className="text-sm text-[var(--color-ink-faint)] font-data truncate max-w-[200px]">
                    {r.filename}
                  </TD>
                  <TD className="text-sm">
                    {r.uploadedBy?.name ?? '—'}
                    {r.uploadedBy?.rollNo && (
                      <span className="text-xs text-[var(--color-ink-faint)] ml-1">({r.uploadedBy.rollNo})</span>
                    )}
                  </TD>
                  <TD>
                    <Badge tone={r.status === 'approved' ? 'verdant' : 'seal'}>
                      {r.status === 'approved' ? 'Approved' : 'Pending Review'}
                    </Badge>
                  </TD>
                  <TD className="font-data text-xs text-[var(--color-ink-faint)]">
                    {new Date(r.createdAt ?? r.updatedAt).toLocaleDateString()}
                  </TD>
                  <TD>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDownload(r._id, r.filename)}
                      >
                        <Download size={13} /> Download
                      </Button>
                      {r.status !== 'approved' && (
                        <Button size="sm" variant="success" onClick={() => handleApprove(r._id)}>
                          <CheckCircle2 size={13} /> Approve
                        </Button>
                      )}
                    </div>
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </AppShell>
  );
}
