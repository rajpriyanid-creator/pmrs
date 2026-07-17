import { BookOpen } from 'lucide-react';

interface Rule {
  text: string;
  type?: 'info' | 'warning' | 'tip';
}

const ROLE_RULES: Record<string, { title: string; rules: Rule[] }> = {
  admin: {
    title: 'Admin Responsibilities',
    rules: [
      { text: 'Manage faculty records and set guide team-limit caps (UG and PG separately).' },
      { text: 'Assign guides, panel members, and coordinators per team via the Allocations Dashboard.' },
      { text: 'Use "Save Changes" batch-save — edits are not persisted until you save.', type: 'warning' },
      { text: 'View attendance and marks in read-only mode; you cannot edit them.' },
      { text: 'Use Admin Config to open/close the guide-selection window and team-formation period.' },
      { text: 'Danger Zone actions (bulk deletes) are irreversible — confirm carefully.', type: 'warning' },
    ],
  },
  coordinator: {
    title: 'Coordinator Responsibilities',
    rules: [
      { text: 'You are scoped to one program — only your assigned teams are visible.' },
      { text: 'Set review dates, times, and durations for each team independently.' },
      { text: 'Record and update attendance (review + semester) — there is no lock step; it is always editable.', type: 'tip' },
      { text: 'Form viva panels: prefilled internal members are locked; you can only add/remove external examiners.' },
      { text: 'View marks split by who entered what, but you do not enter scores directly.' },
      { text: 'Generate review schedules from submitted availability — check for clash warnings before confirming.', type: 'warning' },
    ],
  },
  guide: {
    title: 'Guide Responsibilities',
    rules: [
      { text: 'Accept or reject team requests up to your UG or PG limit (tracked separately).' },
      { text: 'Enter rubric marks (4 criteria × 10 points each) per student for Review 1–3 and Viva.' },
      { text: 'Review 0 is attendance-only — you cannot enter marks for it.', type: 'info' },
      { text: 'Marks are save-draft / confirm: confirming publishes to students and recomputes the average.', type: 'tip' },
      { text: 'Approve your teams\' final report uploads after reviewing them.' },
      { text: 'Submit your availability slots for the scheduling system to auto-assign review times.' },
    ],
  },
  panel: {
    title: 'Panel Member Responsibilities',
    rules: [
      { text: 'You are assigned to specific teams — only those teams appear in your view.' },
      { text: 'Enter rubric marks (4 criteria × 10 points) per student for each assigned review.' },
      { text: 'Confirm marks to publish them; drafts are visible only to you.', type: 'tip' },
      { text: 'Submit your availability so the coordinator can schedule review slots.' },
      { text: 'Your marks are averaged with the guide\'s marks for the team\'s final score.' },
    ],
  },
  assistant: {
    title: 'Assistant Access',
    rules: [
      { text: 'View-only access to all faculty, attendance, and marks data.' },
      { text: 'Download Excel exports of any module — no edit actions are available.', type: 'info' },
      { text: 'You cannot enter marks, record attendance, or make any changes.' },
    ],
  },
  student: {
    title: 'Student Guide',
    rules: [
      { text: 'Form a team and invite others (solo teams are allowed).' },
      { text: 'Once your team sends a guide request, wait for acceptance — you cannot withdraw after acceptance.' },
      { text: 'Team lock is one-directional: once locked, it cannot be undone by another member.', type: 'warning' },
      { text: 'Upload your team\'s final report — this replaces any previous upload.' },
      { text: 'View your own marks and attendance after they are published/recorded.' },
      { text: 'Check your assigned panel members in "My Panel".' },
    ],
  },
};

export function RoleRulesBox({ role }: { role: string }) {
  const config = ROLE_RULES[role];
  if (!config) return null;

  const toneClass = (type?: Rule['type']) => {
    switch (type) {
      case 'warning':
        return 'bg-[var(--color-flag)]/5 border-l-[var(--color-flag)] text-[var(--color-flag)]';
      case 'tip':
        return 'bg-[var(--color-verdant)]/5 border-l-[var(--color-verdant)] text-[var(--color-verdant)]';
      case 'info':
        return 'bg-[var(--color-seal)]/5 border-l-[var(--color-seal)] text-[var(--color-seal)]';
      default:
        return 'bg-[var(--color-ink)]/3 border-l-[var(--color-ink)]/20 text-[var(--color-ink-faint)]';
    }
  };

  return (
    <div className="rounded-xl border border-[var(--color-ink)]/8 bg-white overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[var(--color-ink)]/8 flex items-center gap-2.5">
        <BookOpen size={15} className="text-[var(--color-seal)]" />
        <h3 className="text-sm font-semibold text-[var(--color-ink)]">{config.title}</h3>
      </div>
      <ul className="divide-y divide-[var(--color-ink)]/5">
        {config.rules.map((rule, i) => (
          <li key={i} className={`px-5 py-3 border-l-2 text-sm leading-relaxed ${toneClass(rule.type)}`}>
            {rule.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
