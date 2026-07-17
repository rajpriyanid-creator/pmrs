import { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

const fieldBase =
  'w-full rounded-lg border border-[var(--color-ink)]/15 bg-white px-3.5 py-2.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] transition-colors focus:border-[var(--color-seal)] focus:outline-none disabled:bg-[var(--color-paper-dim)] disabled:opacity-60';

export function Field({
  label,
  hint,
  error,
  children,
  required,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-[var(--color-ink-soft)] mb-1.5">
        {label}
        {required && <span className="text-[var(--color-flag)] ml-0.5">*</span>}
      </span>
      {children}
      {hint && !error && <span className="block text-xs text-[var(--color-ink-faint)] mt-1">{hint}</span>}
      {error && <span className="block text-xs text-[var(--color-flag)] mt-1">{error}</span>}
    </label>
  );
}

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${fieldBase} ${className}`} {...props} />;
}

export function Textarea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${fieldBase} min-h-24 resize-y ${className}`} {...props} />;
}

export function Select({ className = '', children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`${fieldBase} appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22 fill=%22%236B7484%22><path d=%22M5.5 7.5l4.5 4.5 4.5-4.5%22 stroke=%22%236B7484%22 stroke-width=%221.5%22 fill=%22none%22 stroke-linecap=%22round%22/></svg>')] bg-no-repeat bg-[right_0.9rem_center] pr-9 ${className}`} {...props}>
      {children}
    </select>
  );
}

export function Checkbox({ label, className = '', ...props }: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        className={`h-4.5 w-4.5 rounded border-[var(--color-ink)]/25 text-[var(--color-verdant)] focus:ring-2 focus:ring-[var(--color-seal)]/40 ${className}`}
        {...props}
      />
      {label && <span className="text-sm text-[var(--color-ink)]">{label}</span>}
    </label>
  );
}
