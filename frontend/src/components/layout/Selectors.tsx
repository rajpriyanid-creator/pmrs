import { Select } from '@/components/ui/Form';
import { usePrograms } from '@/api/programs';
import { useTeamList } from '@/api/teams';

export function ProgramSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { data: programs, isLoading } = usePrograms();
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)} disabled={isLoading}>
      <option value="">Select program…</option>
      {programs?.map((p) => (
        <option key={p._id} value={p._id}>
          {p.name} ({p.type})
        </option>
      ))}
    </Select>
  );
}

export function TeamSelect({
  program,
  value,
  onChange,
}: {
  program: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const { data, isLoading } = useTeamList({ program });
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)} disabled={!program || isLoading}>
      <option value="">Select team…</option>
      {data?.items.map((t) => (
        <option key={t._id} value={t._id}>
          {t.name}
        </option>
      ))}
    </Select>
  );
}
