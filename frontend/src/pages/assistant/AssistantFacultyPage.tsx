import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Form';
import { Table, THead, TH, TR, TD, EmptyState, TableSkeleton } from '@/components/ui/Table';
import { Search, Download } from 'lucide-react';
import { downloadFacultyList, useFacultyList } from '@/api/faculty';
import { triggerDownload } from '@/lib/download';

export function AssistantFacultyPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useFacultyList(search);

  async function handleExport() {
    const res = await downloadFacultyList();
    triggerDownload(res.data, 'faculty.xlsx');
  }

  return (
    <AppShell title="Faculty">
      <PageHeader
        title="Faculty Directory"
        description="Read-only view."
        action={
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <Download size={15} /> Export
          </Button>
        }
      />

      <Card>
        <div className="p-4 border-b border-[var(--color-ink)]/8">
          <div className="relative max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-faint)]" />
            <Input placeholder="Search…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {isLoading ? (
          <TableSkeleton />
        ) : !data || data.items.length === 0 ? (
          <EmptyState title="No faculty found" />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Name</TH>
                <TH>Designation</TH>
                <TH>Email</TH>
              </tr>
            </THead>
            <tbody>
              {data.items.map((f) => (
                <TR key={f._id}>
                  <TD className="font-medium">{f.name}</TD>
                  <TD>{f.designation}</TD>
                  <TD className="text-[var(--color-ink-faint)]">{f.email}</TD>
                </TR>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </AppShell>
  );
}
