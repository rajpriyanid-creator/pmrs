import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Download } from 'lucide-react';
import { downloadFacultyList } from '@/api/faculty';
import { downloadAttendance } from '@/api/attendance';
import { downloadMarks } from '@/api/marks';
import { triggerDownload } from '@/lib/download';

export function AssistantExportsPage() {
  const exports = [
    { label: 'Faculty Directory', fn: async () => triggerDownload((await downloadFacultyList()).data, 'faculty.xlsx') },
    { label: 'All Attendance', fn: async () => triggerDownload((await downloadAttendance({})).data, 'attendance.xlsx') },
    { label: 'All Marks', fn: async () => triggerDownload((await downloadMarks({})).data, 'marks.xlsx') },
  ];

  return (
    <AppShell title="Exports">
      <PageHeader title="Exports" description="Download institution-wide records as Excel workbooks." />

      <Card>
        <div className="divide-y divide-[var(--color-ink)]/8">
          {exports.map((item) => (
            <div key={item.label} className="flex items-center justify-between px-6 py-4">
              <p className="text-sm font-medium text-[var(--color-ink)]">{item.label}</p>
              <Button variant="secondary" size="sm" onClick={item.fn}>
                <Download size={15} /> Download
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </AppShell>
  );
}
