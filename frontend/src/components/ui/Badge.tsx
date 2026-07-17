type Tone = "seal" | "verdant" | "flag" | "neutral";

const TONE_CLASSES: Record<Tone, string> = {
  seal: "bg-seal-soft text-seal-dark",
  verdant: "bg-verdant-soft text-verdant-dark",
  flag: "bg-flag-soft text-flag-dark",
  neutral: "bg-ink/10 text-ink",
};

/** Status conveyed by color always carries a text label too (Section 9 accessibility floor). */
export function Badge({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]}`}>{children}</span>;
}
