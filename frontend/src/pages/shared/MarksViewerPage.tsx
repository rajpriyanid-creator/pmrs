import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, THead, TH, TR, TD, EmptyState, TableSkeleton } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Card';
import { ProgramSelect, TeamSelect } from '@/components/layout/Selectors';
import { Download } from 'lucide-react';
import { downloadMarks, useMarksSummary } from '@/api/marks';
import { triggerDownload } from '@/lib/download';
import { REVIEW_LABELS, ReviewType } from '@/types';

export function MarksViewerPage({ title }: { title: string }) {
  const [program, setProgram] = useState('');
  const [teamId, setTeamId] = useState('');
  const { data, isLoading } = useMarksSummary(teamId);

  async function handleExport() {
    const res = await downloadMarks({ teamId: teamId || undefined });
    triggerDownload(res.data, 'marks.xlsx');
  }

  return (
    <AppShell title={title}>
      <PageHeader
        title="Marks"
        description="Cached per-review averages, recomputed on every confirmed submission."
        action={
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <Download size={15} /> Export Excel
          </Button>
        }
      />

      <Card>
        <div className="p-4 border-b border-[var(--color-ink)]/8 flex flex-col sm:flex-row gap-3 sm:max-w-lg">
          <ProgramSelect value={program} onChange={(v) => { setProgram(v); setTeamId(''); }} />
          <TeamSelect program={program} value={teamId} onChange={setTeamId} />
        </div>

        {!teamId ? (
          <EmptyState title="Choose a team" description="Select a program and team to view marks." />
        ) : isLoading ? (
          <TableSkeleton />
        ) : !data || data.summaries.length === 0 ? (
          <EmptyState title="No marks published yet" />
        ) : (
          <>
            <div className="px-6 pt-5 pb-2 flex items-center gap-3">
              <span className="text-sm text-[var(--color-ink-faint)]">Overall average</span>
              <span className="font-display text-2xl text-[var(--color-verdant)]">{data.overall.toFixed(1)}</span>
            </div>
            <Table>
              <THead>
                <tr>
                  <TH>Review</TH>
                  <TH>Average</TH>
                  <TH>Breakdown</TH>
                </tr>
              </THead>
              <tbody>
                {data.summaries.map((s, i) => {
                  const type = (typeof s.reviewId === 'object' ? s.reviewId.type : undefined) as ReviewType | undefined;
                  return (
                    <TR key={i}>
                      <TD className="font-medium">{type ? REVIEW_LABELS[type] : '—'}</TD>
                      <TD className="font-data font-semibold text-[var(--color-verdant)]">{s.average.toFixed(1)}</TD>
                      <TD>
                        <div className="flex gap-1.5 flex-wrap">
                          {s.breakdown.map((b, j) => (
                            <Badge key={j} tone="neutral">
                              {b.role}: {b.score}
                            </Badge>
                          ))}
                        </div>
                      </TD>
                    </TR>
                  );
                })}
              </tbody>
            </Table>
          </>
        )}
      </Card>
    </AppShell>
  );
}
