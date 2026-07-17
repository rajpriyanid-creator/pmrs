import { useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Form';
import { Table, THead, TH, TR, TD, EmptyState, TableSkeleton } from '@/components/ui/Table';
import { ProgramSelect } from '@/components/layout/Selectors';
import { Sparkles, Save } from 'lucide-react';
import { useAllocationTable, useAutoAssign, useBatchUpdateAssignments } from '@/api/assignments';
import { useFacultyList } from '@/api/faculty';
import { toast } from '@/components/ui/Toast';
import { apiErrorMessage } from '@/api/client';

interface RowEdit {
  guideId?: string;
  coordinatorId?: string;
  panelMemberIds?: string[];
}

export function AdminAllocationsPage() {
  const [program, setProgram] = useState('');
  const { data: rows, isLoading } = useAllocationTable(program);
  const { data: facultyData } = useFacultyList();
  const faculty = facultyData?.items ?? [];
  const batchUpdate = useBatchUpdateAssignments();
  const autoAssign = useAutoAssign();

  const [edits, setEdits] = useState<Record<string, RowEdit>>({});

  const dirtyCount = Object.keys(edits).length;

  function setEdit(teamId: string, patch: RowEdit) {
    setEdits((prev) => ({ ...prev, [teamId]: { ...prev[teamId], ...patch } }));
  }

  async function handleSave() {
    if (!program || dirtyCount === 0) return;
    try {
      await batchUpdate.mutateAsync({
        program,
        updates: Object.entries(edits).map(([teamId, edit]) => ({ teamId, ...edit })),
      });
      toast.success(`Saved ${dirtyCount} change(s).`);
      setEdits({});
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function handleAutoAssign() {
    if (!program) return;
    try {
      const result = await autoAssign.mutateAsync(program);
      toast.success(`Auto-assigned ${result.assignedCount} team(s). ${result.unassignedRemaining} remain unassigned.`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <AppShell title="Allocations">
      <PageHeader
        title="Allocation Dashboard"
        description="Assign guides, coordinators and panel members. Changes save together as one batch."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleAutoAssign} disabled={!program} loading={autoAssign.isPending}>
              <Sparkles size={15} /> Auto-assign guides
            </Button>
            <Button size="sm" onClick={handleSave} disabled={dirtyCount === 0} loading={batchUpdate.isPending}>
              <Save size={15} /> Save {dirtyCount > 0 ? `(${dirtyCount})` : ''}
            </Button>
          </div>
        }
      />

      <Card>
        <div className="p-4 border-b border-[var(--color-ink)]/8 max-w-xs">
          <ProgramSelect value={program} onChange={setProgram} />
        </div>

        {!program ? (
          <EmptyState title="Choose a program" description="Select a program to view and edit its allocation table." />
        ) : isLoading ? (
          <TableSkeleton cols={4} />
        ) : !rows || rows.length === 0 ? (
          <EmptyState title="No teams yet" description="Teams will appear here once students form and lock them." />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Team</TH>
                <TH>Guide</TH>
                <TH>Coordinator</TH>
                <TH>Panel Members</TH>
              </tr>
            </THead>
            <tbody>
              {rows.map((row) => {
                const edit = edits[row.teamId] ?? {};
                return (
                  <TR key={row.teamId}>
                    <TD className="font-medium">{row.teamName}</TD>
                    <TD>
                      <Select
                        className="min-w-[180px]"
                        value={edit.guideId ?? (typeof row.guide === 'object' ? row.guide?._id ?? '' : '')}
                        onChange={(e) => setEdit(row.teamId, { guideId: e.target.value })}
                      >
                        <option value="">Unassigned</option>
                        {faculty.map((f) => (
                          <option key={f._id} value={f._id}>
                            {f.name}
                          </option>
                        ))}
                      </Select>
                    </TD>
                    <TD>
                      <Select
                        className="min-w-[180px]"
                        value={edit.coordinatorId ?? row.panel?.coordinatorId?._id ?? ''}
                        onChange={(e) => setEdit(row.teamId, { coordinatorId: e.target.value })}
                      >
                        <option value="">None</option>
                        {faculty.map((f) => (
                          <option key={f._id} value={f._id}>
                            {f.name}
                          </option>
                        ))}
                      </Select>
                    </TD>
                    <TD>
                      <PanelMemberPicker
                        faculty={faculty}
                        selected={edit.panelMemberIds ?? row.panel?.memberIds?.map((m: any) => m._id) ?? []}
                        onChange={(ids) => setEdit(row.teamId, { panelMemberIds: ids })}
                      />
                    </TD>
                  </TR>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </AppShell>
  );
}

function PanelMemberPicker({
  faculty,
  selected,
  onChange,
}: {
  faculty: { _id: string; name: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const label = useMemo(() => {
    if (selected.length === 0) return 'Select members…';
    return faculty.filter((f) => selected.includes(f._id)).map((f) => f.name).join(', ') || `${selected.length} selected`;
  }, [selected, faculty]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="min-w-[200px] max-w-[240px] truncate text-left rounded-lg border border-[var(--color-ink)]/15 bg-white px-3 py-2 text-sm hover:border-[var(--color-ink)]/25"
      >
        {label}
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-64 max-h-56 overflow-y-auto bg-white rounded-lg border border-[var(--color-ink)]/10 shadow-[var(--shadow-raised)] p-2 scrollbar-thin">
          {faculty.map((f) => {
            const checked = selected.includes(f._id);
            return (
              <label key={f._id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[var(--color-paper-dim)] text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={!checked && selected.length >= 4}
                  onChange={(e) => {
                    if (e.target.checked) onChange([...selected, f._id]);
                    else onChange(selected.filter((id) => id !== f._id));
                  }}
                />
                {f.name}
              </label>
            );
          })}
          <p className="text-[10px] text-[var(--color-ink-faint)] px-2 pt-1">Max 4 members per panel</p>
        </div>
      )}
    </div>
  );
}
