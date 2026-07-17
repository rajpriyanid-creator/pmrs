import { useRef, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Card';
import { toast } from '@/components/ui/Toast';
import { apiErrorMessage, api } from '@/api/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload, CheckCircle2, Clock, FileText, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Team } from '@/types';

function useMyTeamReport() {
  return useQuery({
    queryKey: ['my-report'],
    queryFn: async () => {
      const res = await api.get('/reports');
      return (res.data.reports as any[])[0] ?? null;
    },
  });
}

export function StudentReportPage() {
  const qc = useQueryClient();
  const { data: report, isLoading } = useMyTeamReport();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('report', file);
      await api.post('/reports/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Report uploaded successfully. Your guide has been notified.');
      qc.invalidateQueries({ queryKey: ['my-report'] });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  }

  return (
    <AppShell title="Final Report">
      <PageHeader
        title="Final Report"
        description="Upload your team's final project report. Your guide will review and approve it."
      />

      <div className="max-w-xl space-y-6">
        {/* Upload area */}
        <Card>
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-seal)]/10 flex items-center justify-center">
                <FileText size={20} className="text-[var(--color-seal)]" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--color-ink)]">Upload Report</h3>
                <p className="text-xs text-[var(--color-ink-faint)]">PDF, Word (.doc/.docx), or ZIP — max 50 MB</p>
              </div>
            </div>

            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-[var(--color-ink)]/15 rounded-xl p-8 text-center cursor-pointer
                         hover:border-[var(--color-seal)]/40 hover:bg-[var(--color-seal)]/2 transition-all group"
            >
              <Upload size={28} className="mx-auto mb-3 text-[var(--color-ink-faint)] group-hover:text-[var(--color-seal)] transition-colors" />
              <p className="text-sm font-medium text-[var(--color-ink)]">
                {uploading ? 'Uploading…' : 'Click to upload your report'}
              </p>
              <p className="text-xs text-[var(--color-ink-faint)] mt-1">Uploading a new file replaces the previous upload</p>
            </div>

            <input ref={fileRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.zip" onChange={handleUpload} />

            <Button
              onClick={() => fileRef.current?.click()}
              loading={uploading}
              className="w-full"
            >
              <Upload size={15} /> {report ? 'Replace Report' : 'Upload Report'}
            </Button>
          </div>
        </Card>

        {/* Current status */}
        {isLoading ? (
          <Card>
            <div className="p-6 flex items-center justify-center">
              <RefreshCw size={20} className="animate-spin text-[var(--color-ink-faint)]" />
            </div>
          </Card>
        ) : report ? (
          <Card>
            <div className="p-5 space-y-4">
              <h3 className="font-semibold text-[var(--color-ink)] text-sm">Current Submission</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-[var(--color-seal)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--color-ink)]">{report.filename}</p>
                    <p className="text-xs text-[var(--color-ink-faint)]">
                      Uploaded {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Badge tone={report.status === 'approved' ? 'verdant' : 'neutral'}>
                  {report.status === 'approved' ? (
                    <span className="flex items-center gap-1"><CheckCircle2 size={12} /> Approved</span>
                  ) : (
                    <span className="flex items-center gap-1"><Clock size={12} /> Pending Review</span>
                  )}
                </Badge>
              </div>
              {report.status === 'approved' && report.approvedBy && (
                <p className="text-xs text-[var(--color-verdant)]">
                  ✓ Approved by {report.approvedBy?.name ?? 'your guide'}
                  {report.approvedAt && ` on ${new Date(report.approvedAt).toLocaleDateString()}`}
                </p>
              )}
              {report.status !== 'approved' && (
                <p className="text-xs text-[var(--color-ink-faint)]">
                  Your guide will review this and approve it when ready. You'll receive a notification.
                </p>
              )}
            </div>
          </Card>
        ) : (
          <Card>
            <div className="p-5 text-center">
              <p className="text-sm text-[var(--color-ink-faint)]">No report submitted yet.</p>
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
