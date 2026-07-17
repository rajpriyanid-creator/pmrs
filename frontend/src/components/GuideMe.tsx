import { useState } from 'react';
import { HelpCircle, X, ChevronRight, ChevronLeft } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface GuideStep {
  title: string;
  content: string;
  target?: string; // CSS selector hint for highlighting (informational only)
}

const ROLE_GUIDES: Record<string, GuideStep[]> = {
  admin: [
    {
      title: 'Welcome, Admin',
      content: 'You have full system access. Start by managing Faculty records — add members manually or import a spreadsheet with the Seniority-first column format.',
    },
    {
      title: 'Allocations Dashboard',
      content: 'Assign guides, panel members, and coordinators to teams here. Edit multiple rows, then hit "Save Changes" once — all updates are committed in a single batch.',
    },
    {
      title: 'Guide Limits',
      content: 'Set UG and PG guide team-limits independently. Each guide\'s remaining capacity is tracked separately for UG and PG assignments.',
    },
    {
      title: 'Admin Config',
      content: 'Control the guide-selection window (open/close + date range) and team-formation toggle from Admin Config. Use the Danger Zone carefully — bulk deletes are irreversible.',
    },
    {
      title: 'Read-only Attendance & Marks',
      content: 'Attendance is always entered by Coordinators. You can view it here in read-only mode. Marks are entered by Guides and Panel Members.',
    },
  ],
  coordinator: [
    {
      title: 'Welcome, Coordinator',
      content: 'You\'re scoped to your assigned program. Only teams in your program are visible here. Start by scheduling review dates and times for each team.',
    },
    {
      title: 'Attendance Recording',
      content: 'Go to Attendance to record review and semester attendance. There\'s no lock step — attendance can always be updated. Review date/time fields sit above the checkboxes.',
    },
    {
      title: 'Scheduling',
      content: 'Ask guides and panel members to submit their availability. Then use the Scheduling page to auto-generate clash-free review slots, or create slots manually per team.',
    },
    {
      title: 'Viva Panels',
      content: 'Your Viva panel is pre-filled with your review panel\'s internal members. You can only add or remove external examiners — the internal composition is locked.',
    },
    {
      title: 'Letter Generation',
      content: 'Generate formal letters (viva invitation, examiner appointment, chairman letter) from the Documents page. Upload your signature to auto-stamp letters.',
    },
  ],
  guide: [
    {
      title: 'Welcome, Guide',
      content: 'Your dashboard shows team requests from students. You have separate UG and PG capacity counters — each is tracked independently.',
    },
    {
      title: 'Team Requests',
      content: 'Accept or reject incoming requests. Once you reach your limit for a program type (UG or PG), no more requests can be accepted for that type.',
    },
    {
      title: 'Marks Entry',
      content: 'Enter marks per student using a 4-criteria rubric (each out of 10). Save a draft first, then Confirm to publish to the team and recompute averages.',
    },
    {
      title: 'Availability & Scheduling',
      content: 'Submit your available time slots for each review period. The coordinator uses these to generate clash-free schedules automatically.',
    },
    {
      title: 'Final Reports',
      content: 'When your teams upload their final report, you\'ll see it in the Reports section. Review and approve it there — students are notified on approval.',
    },
  ],
  panel: [
    {
      title: 'Welcome, Panel Member',
      content: 'You\'re assigned to specific teams by the admin. Only your assigned teams are visible here.',
    },
    {
      title: 'Marks Entry',
      content: 'Enter rubric marks (4 criteria × 10 = 40 points total) per student. Save a draft first, then Confirm to publish. Your marks are averaged with the guide\'s.',
    },
    {
      title: 'Availability',
      content: 'Submit your available time windows for the coordinator to schedule review slots. If you have a clash, the system will flag it.',
    },
  ],
  student: [
    {
      title: 'Welcome, Student',
      content: 'Start by forming or joining a team. You can invite others by searching for them, or go solo — single-student teams are fully supported.',
    },
    {
      title: 'Requesting a Guide',
      content: 'Browse available guides on the Guides page — you can see their remaining capacity. Send a request to your preferred guide. You\'ll be notified when they respond.',
    },
    {
      title: 'Team Lock',
      content: 'Once you\'re happy with your team composition, lock it. Locking is one-directional — no member can reverse it, so make sure everyone agrees first.',
    },
    {
      title: 'Final Report',
      content: 'Upload your final report PDF/Word file on the Report page. This replaces any previous upload. Your guide will receive a notification to review and approve it.',
    },
    {
      title: 'Marks & Attendance',
      content: 'Your marks are published after your guide/panel confirm them. Attendance is recorded by your coordinator after each review session.',
    },
  ],
  assistant: [
    {
      title: 'Welcome, Assistant',
      content: 'You have read-only access to faculty data, attendance records, and marks across all programs.',
    },
    {
      title: 'Exports',
      content: 'Use the Exports page to download Excel files for any module. All data is available for download but nothing can be edited from your account.',
    },
  ],
};

export function GuideMe() {
  const profile = useAuthStore((s) => s.profile);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  const role = profile?.role ?? '';
  const steps = ROLE_GUIDES[role] ?? [];

  if (steps.length === 0) return null;

  return (
    <>
      {/* Floating trigger button */}
      <button
        id="guide-me-btn"
        onClick={() => { setOpen(true); setStep(0); }}
        className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-[var(--color-seal)] text-white
                   flex items-center justify-center shadow-lg shadow-[var(--color-seal)]/30
                   hover:bg-[var(--color-seal)]/90 transition-all hover:scale-105 active:scale-95"
        title="Help & Guide"
      >
        <HelpCircle size={20} />
      </button>

      {/* Overlay panel */}
      {open && (
        <>
          <div className="fixed inset-0 z-50 bg-[var(--color-ink)]/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="fixed bottom-20 right-6 z-50 w-80 rounded-2xl bg-white shadow-2xl shadow-[var(--color-ink)]/15
                          border border-[var(--color-ink)]/8 overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 bg-[var(--color-seal)] flex items-center justify-between">
              <div>
                <p className="text-xs text-white/70 uppercase tracking-wide font-medium">Getting Started</p>
                <p className="text-white font-semibold text-sm mt-0.5">
                  {steps[step]?.title}
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Step indicator */}
            <div className="flex gap-1 px-5 pt-3">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={`flex-1 h-1 rounded-full transition-colors ${
                    i === step ? 'bg-[var(--color-seal)]' : 'bg-[var(--color-ink)]/10'
                  }`}
                />
              ))}
            </div>

            {/* Content */}
            <div className="px-5 py-4">
              <p className="text-sm text-[var(--color-ink)] leading-relaxed">
                {steps[step]?.content}
              </p>
            </div>

            {/* Navigation */}
            <div className="px-5 pb-4 flex items-center justify-between">
              <button
                onClick={() => setStep(Math.max(0, step - 1))}
                disabled={step === 0}
                className="flex items-center gap-1 text-sm text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]
                           disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={15} /> Prev
              </button>
              <span className="text-xs text-[var(--color-ink-faint)]">{step + 1} / {steps.length}</span>
              {step < steps.length - 1 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  className="flex items-center gap-1 text-sm font-medium text-[var(--color-seal)] hover:text-[var(--color-seal)]/80 transition-colors"
                >
                  Next <ChevronRight size={15} />
                </button>
              ) : (
                <button
                  onClick={() => setOpen(false)}
                  className="text-sm font-medium text-[var(--color-verdant)] hover:text-[var(--color-verdant)]/80 transition-colors"
                >
                  Got it ✓
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
