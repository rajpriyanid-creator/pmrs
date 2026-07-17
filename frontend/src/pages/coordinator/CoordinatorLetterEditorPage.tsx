import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Form';
import { toast } from '@/components/ui/Toast';
import { apiErrorMessage, api } from '@/api/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Download, Eye } from 'lucide-react';
import { useTeamList } from '@/api/teams';
import { downloadLetterPDF } from '@/api/documents';

const LETTER_TYPES = [
  { id: 'viva_letter', label: 'Viva Letter (External Examiner Invitation)' },
  { id: 'internal_examiner_letter', label: 'Internal Examiner Appointment Letter' },
  { id: 'external_examiner_letter', label: 'External Examiner Claim Letter' },
  { id: 'chairman_letter', label: 'Chairman Appointment Letter' },
];

export function CoordinatorLetterEditorPage() {
  const { data: teams } = useTeamList();
  const [teamId, setTeamId] = useState('');
  const [letterType, setLetterType] = useState(LETTER_TYPES[0].id);
  const [reviewDate, setReviewDate] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  async function handlePreview() {
    if (!teamId) return toast.error('Select a team first');
    setLoading(true);
    try {
      const params = new URLSearchParams({ teamId });
      if (reviewDate) params.set('reviewDate', new Date(reviewDate).toLocaleDateString('en-IN'));
      const res = await api.get(`/documents/preview/${letterType}?${params}`);
      setPreview(res.data.preview);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    if (!teamId) return toast.error('Select a team first');
    setDownloading(true);
    try {
      const selectedTeamObj = teams?.items.find((t) => t._id === teamId);
      const dateStr = reviewDate ? new Date(reviewDate).toLocaleDateString('en-IN') : undefined;
      await downloadLetterPDF(letterType, teamId, dateStr, selectedTeamObj?.name);
      toast.success('Downloaded official PDF letter');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <AppShell title="Letter Generator">
      <PageHeader
        title="Letter Generator"
        description="Generate formal letters for viva, examiner appointments, and more."
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Controls */}
        <Card className="lg:col-span-2">
          <div className="p-5 border-b border-[var(--color-ink)]/8">
            <h3 className="font-semibold text-[var(--color-ink)] flex items-center gap-2">
              <FileText size={15} className="text-[var(--color-seal)]" /> Configure Letter
            </h3>
          </div>
          <div className="p-5 space-y-4">
            <Field label="Letter type" required>
              <Select value={letterType} onChange={(e) => { setLetterType(e.target.value); setPreview(null); }}>
                {LETTER_TYPES.map((lt) => (
                  <option key={lt.id} value={lt.id}>{lt.label}</option>
                ))}
              </Select>
            </Field>

            <Field label="Team" required>
              <Select value={teamId} onChange={(e) => { setTeamId(e.target.value); setPreview(null); }}>
                <option value="">Select team…</option>
                {teams?.items.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
              </Select>
            </Field>

            <Field label="Review / Viva date">
              <Input type="date" value={reviewDate} onChange={(e) => setReviewDate(e.target.value)} />
            </Field>

            <div className="flex gap-2 pt-2">
              <Button onClick={handlePreview} loading={loading} variant="secondary" className="flex-1">
                <Eye size={14} /> Preview
              </Button>
              <Button onClick={handleDownload} loading={downloading} className="flex-1">
                <Download size={14} /> Download
              </Button>
            </div>
          </div>
        </Card>

        {/* Preview */}
        <div className="lg:col-span-3">
          <Card className="h-full">
            <div className="p-4 border-b border-[var(--color-ink)]/8">
              <h3 className="font-semibold text-[var(--color-ink)] text-sm">Letter Preview</h3>
            </div>
            <div className="p-6">
              {preview ? (
                <pre className="whitespace-pre-wrap font-data text-sm text-[var(--color-ink)] leading-relaxed bg-[var(--color-paper)] rounded-xl p-5 border border-[var(--color-ink)]/8 min-h-[400px]">
                  {preview}
                </pre>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[300px] text-center space-y-3">
                  <FileText size={40} className="text-[var(--color-ink-faint)]" />
                  <p className="text-sm text-[var(--color-ink-faint)]">
                    Select a team and click Preview to see the generated letter.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
