import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, THead, TH, TR, TD, EmptyState, TableSkeleton, Skeleton } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Card';
import { ProgramSelect, TeamSelect } from '@/components/layout/Selectors';
import { Download } from 'lucide-react';
import { downloadAttendance, useTeamAttendance } from '@/api/attendance';
import { triggerDownload } from '@/lib/download';

export function AttendanceViewerPage({ title }: { title: string }) {
  const [program, setProgram] = useState('');
  const [teamId, setTeamId] = useState('');
  const { data, isLoading } = useTeamAttendance(teamId);

  async function handleExport() {
    const res = await downloadAttendance({ teamId: teamId || undefined, program: program || undefined });
    triggerDownload(res.data, 'attendance.xlsx');
  }

  return (
    <AppShell title={title}>
      <PageHeader
        title="Attendance Records"
        description="Read-only mirror of coordinator-recorded attendance."
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
          <EmptyState title="Choose a team" description="Select a program and team to view attendance." />
        ) : isLoading ? (
          <TableSkeleton />
        ) : !data || data.length === 0 ? (
          <EmptyState title="No attendance recorded yet" />
        ) : (
          <div className="divide-y divide-[var(--color-ink)]/8">
            {data.map((record) => (
              <div key={record._id} className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Badge tone={record.kind === 'review' ? 'seal' : 'verdant'}>{record.kind === 'review' ? 'Review' : 'Semester'}</Badge>
                  {record.reviewDate && (
                    <span className="text-xs text-[var(--color-ink-faint)]">
                      {new Date(record.reviewDate).toLocaleDateString()} {record.reviewTime && `· ${record.reviewTime}`}
                    </span>
                  )}
                </div>
                <Table>
                  <THead>
                    <tr>
                      <TH>Student</TH>
                      <TH>Roll No</TH>
                      <TH>Status</TH>
                    </tr>
                  </THead>
                  <tbody>
                    {record.perStudent.map((entry, i) => {
                      const student = typeof entry.studentId === 'object' ? entry.studentId : null;
                      return (
                        <TR key={i}>
                          <TD>{student?.name ?? '—'}</TD>
                          <TD className="font-data">{student?.rollNo ?? '—'}</TD>
                          <TD>
                            <Badge tone={entry.present ? 'verdant' : 'flag'}>{entry.present ? 'Present' : 'Absent'}</Badge>
                          </TD>
                        </TR>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            ))}
          </div>
        )}
      </Card>
    </AppShell>
  );
}

export function AttendanceLoadingFallback() {
  return <Skeleton className="h-40" />;
}
