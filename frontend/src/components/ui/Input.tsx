import { forwardRef, type InputHTMLAttributes } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }>(
  ({ label, error, className = "", id, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && <label htmlFor={id} className="text-sm font-medium text-ink/80">{label}</label>}
      <input
        ref={ref}
        id={id}
        className={`rounded border px-3 py-2 text-sm outline-none focus:border-seal ${error ? "border-flag" : "border-ink/20"} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-flag">{error}</p>}
    </div>
  ),
);
Input.displayName = "Input";
