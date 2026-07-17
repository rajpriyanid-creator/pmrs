import { Code2, GraduationCap, Heart, Layers } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Link } from 'react-router-dom';

interface Developer {
  name: string;
  role: string;
  rollNo?: string;
  github?: string;
}

const DEVELOPERS: Developer[] = [
  { name: 'Student Developer 1', role: 'Full-Stack Developer', rollNo: 'CS001' },
  { name: 'Student Developer 2', role: 'Backend & API', rollNo: 'CS002' },
  { name: 'Student Developer 3', role: 'Frontend & UI', rollNo: 'CS003' },
  { name: 'Student Developer 4', role: 'Database & Architecture', rollNo: 'CS004' },
];

const TECH_STACK = [
  { label: 'MongoDB', desc: 'Document database' },
  { label: 'Express.js', desc: 'API framework' },
  { label: 'React 18 + Vite', desc: 'Frontend framework' },
  { label: 'Node.js + TypeScript', desc: 'Runtime & typing' },
  { label: 'TanStack Query', desc: 'Server state management' },
  { label: 'Socket.IO', desc: 'Real-time notifications' },
  { label: 'Tailwind CSS', desc: 'Utility-first styling' },
  { label: 'JWT + bcrypt', desc: 'Authentication & security' },
];

export function CreditsPage() {
  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      {/* Hero */}
      <div className="relative overflow-hidden bg-[var(--color-ink)] text-white">
        <div className="absolute inset-0 opacity-5">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: `${Math.random() * 200 + 50}px`,
                height: `${Math.random() * 200 + 50}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.3,
              }}
            />
          ))}
        </div>
        <div className="relative max-w-4xl mx-auto px-6 py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-seal)] flex items-center justify-center mx-auto mb-6">
            <GraduationCap size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-display font-bold mb-3">PRMS</h1>
          <p className="text-white/70 text-lg mb-2">Project Review Management System</p>
          <p className="text-white/50 text-sm">
            A full-stack academic capstone management platform built with the MERN stack.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">
        {/* Developer team */}
        <section>
          <h2 className="text-xl font-display font-semibold text-[var(--color-ink)] mb-6 flex items-center gap-2">
            <Code2 size={20} className="text-[var(--color-seal)]" /> Development Team
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {DEVELOPERS.map((dev) => (
              <Card key={dev.name}>
                <div className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[var(--color-seal)]/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-[var(--color-seal)]">
                      {dev.name.slice(0, 1)}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--color-ink)]">{dev.name}</p>
                    <p className="text-sm text-[var(--color-ink-faint)]">{dev.role}</p>
                    {dev.rollNo && (
                      <p className="text-xs font-data text-[var(--color-ink-faint)] mt-0.5">{dev.rollNo}</p>
                    )}
                  </div>
                  {dev.github && (
                    <a
                      href={`https://github.com/${dev.github}`}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-auto text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] transition-colors"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                      </svg>
                    </a>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Tech stack */}
        <section>
          <h2 className="text-xl font-display font-semibold text-[var(--color-ink)] mb-6 flex items-center gap-2">
            <Layers size={20} className="text-[var(--color-seal)]" /> Technology Stack
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TECH_STACK.map((tech) => (
              <div
                key={tech.label}
                className="rounded-xl border border-[var(--color-ink)]/8 bg-white p-4 text-center"
              >
                <p className="font-semibold text-sm text-[var(--color-ink)]">{tech.label}</p>
                <p className="text-xs text-[var(--color-ink-faint)] mt-1">{tech.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <div className="text-center py-6 border-t border-[var(--color-ink)]/8">
          <p className="text-sm text-[var(--color-ink-faint)] flex items-center justify-center gap-1.5">
            Built with <Heart size={14} className="text-[var(--color-flag)]" /> for academic project management
          </p>
          <Link to="/" className="mt-2 inline-block text-xs text-[var(--color-seal)] hover:underline">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
